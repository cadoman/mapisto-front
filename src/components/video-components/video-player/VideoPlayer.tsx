import React, { Key, RefObject } from 'react';
import { Scene } from 'src/entities/Scene';
import { MapistoAPI } from 'src/api/MapistoApi';
import { VideoMap } from 'src/components/map-components/VideoMap/VideoMap';
import { range, zip, timer, Observable, Subscription, Subject, empty, of } from 'rxjs';
import { TimeSelector } from 'src/components/map-components/TimeNavigableMap/TimeSelector';
import './VideoPlayer.css';
import { ControlBar } from '../control-bar/ControlBar';
import { throttleTime, delay } from 'rxjs/operators';
import { LoadingIcon } from 'src/components/map-components/TimeNavigableMap/LoadingIcon';
import { VideoTitle } from '../video-title/VideoTitle';
import { MapistoState } from 'src/entities/mapistoState';

interface Props {
    stateId: number;
}
interface State {
    scenery: Scene[];
    currentYear: number;
    paused: boolean;
    mpStateName: string;
    yearOnMap: number;
    videoIsFullScreen: boolean;
    loadingProgress: number;
    controlBarHidden: boolean;
}
export class VideoPlayer extends React.Component<Props, State>{
    private yearEmitter$: Observable<number>;
    private yearSubscription: Subscription;
    private yearOnMapChange$: Subject<number>;
    private videoSubscription: Subscription;
    private videoPlayerRef: RefObject<HTMLDivElement>;
    private controlBarFadeOut: Subscription;
    constructor(props: Props) {
        super(props);
        this.state = {
            scenery: undefined,
            currentYear: undefined,
            yearOnMap: undefined,
            paused: true,
            videoIsFullScreen: false,
            loadingProgress: 0,
            controlBarHidden: true,
            mpStateName: ""
        };
        this.videoPlayerRef = React.createRef();
        this.yearOnMapChange$ = new Subject<number>();
        this.yearOnMapChange$.pipe(
            throttleTime(300, undefined, { leading: true, trailing: true })
        ).subscribe(y => this.setState({
            yearOnMap: y
        }));
    }

    render() {
        return (
            <div className="full-page-video-container d-flex justify-content-center"
                ref={this.videoPlayerRef}>
                {
                    this.state.scenery ?
                        this.renderReadyPlayer()
                        :
                        this.renderLoadingPlayer()
                }
            </div >
        );

    }

    renderLoadingPlayer() {
        return <div className="video-player d-flex justify-content-center" >
            <div className="d-flex flex-column justify-content-center">
                <div className="video-loading-container">
                    <LoadingIcon loading={true} color="white"></LoadingIcon>
                </div>
                <p className="loading-progress">{this.state.loadingProgress}%</p>
            </div>
        </div>;

    }

    renderReadyPlayer() {
        const scene = this.getCurrentScene();
        return (
            <div className={"video-player " + (this.state.controlBarHidden ? ' hide-cursor' : '')}
                onMouseMove={() => this.makeControlBarAppear()}
                onClick={() => this.makeControlBarAppear()}>
                <VideoTitle hidden={this.state.controlBarHidden} title={this.state.mpStateName + ' : Every year'} />
                <div className="video-time-display">
                    <a
                        className="time-link"
                        href={`/?year=${this.state.currentYear}&x=${scene.bbox.x}&y=${scene.bbox.y}&width=${scene.bbox.width}&height=${scene.bbox.height}`}
                    >                        <TimeSelector year={this.state.currentYear} />
                    </a>
                </div>
                <VideoMap scenery={this.state.scenery} year={this.state.yearOnMap} />
                <ControlBar
                    year={this.state.currentYear}
                    onYearChange={y => this.setVideoAt(y)}
                    paused={this.state.paused}
                    onPause={() => this.state.paused ? this.resume() : this.pause()}
                    start={this.state.scenery[0].startYear}
                    end={this.state.scenery[this.state.scenery.length - 1].endYear}
                    toggleFullScreen={() => this.toggleFullScreen()}
                    videoIsFullScreen={this.state.videoIsFullScreen}
                    hidden={this.state.controlBarHidden}
                />
            </div>
        );
    }



    makeControlBarAppear() {
        this.setState({ controlBarHidden: false });
        if (this.controlBarFadeOut) {
            this.controlBarFadeOut.unsubscribe();
        }
        if (!this.state.paused) {
            this.controlBarFadeOut = of(null).pipe(
                delay(2500)
            ).subscribe(
                () => this.setState({ controlBarHidden: true })
            );
        }
    }

    componentDidMount() {
        this.videoSubscription = MapistoAPI.getVideo(
            this.props.stateId,
            progress => this.setState({ loadingProgress: Math.ceil(100 * progress) })
        ).subscribe(
            scenery => this.setState({
                scenery
            }, () => {
                this.loadStateName()
                this.setVideoAt(scenery[0].startYear);
                this.resume();
            })
        );
        window.addEventListener('keydown', this.handleKeyPress);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyPress);
        if (this.yearSubscription) {
            this.yearSubscription.unsubscribe();
        }
        this.videoSubscription.unsubscribe();
    }

    loadStateName() {
        MapistoAPI.loadState(this.props.stateId, this.state.scenery[this.state.scenery.length - 1].endYear - 1)
            .subscribe(
                mpState => this.setState({ mpStateName: mpState.name })
            );
    }

    private handleKeyPress = ((event: KeyboardEvent) => {
        if (event.key === ' ') {
            if (!this.state.paused) {
                this.pause();
            } else {
                this.resume();
            }
        } else if (event.key.toLocaleLowerCase() === 'f') {
            this.toggleFullScreen();
        }
    }).bind(this);

    private pause() {
        this.setState({
            paused: true
        }, () => this.makeControlBarAppear());
        this.yearSubscription.unsubscribe();
        this.initYearEmitter(this.state.currentYear);
    }


    toggleFullScreen() {
        const d = document as any;
        if (
            d.fullscreenElement ||
            d.webkitFullscreenElement ||
            d.mozFullScreenElement ||
            d.msFullscreenElement
        ) {
            if (d.exitFullscreen) {
                d.exitFullscreen();
            } else if (d.mozCancelFullScreen) {
                d.mozCancelFullScreen();
            } else if (d.webkitExitFullscreen) {
                d.webkitExitFullscreen();
            } else if (d.msExitFullscreen) {
                d.msExitFullscreen();
            }
            this.setState({ videoIsFullScreen: false });
        } else {
            const element = this.videoPlayerRef.current as any;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen((Element as any).ALLOW_KEYBOARD_INPUT);
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
            this.setState({ videoIsFullScreen: true });
        }
    }

    private initYearEmitter(startYear: number) {
        const end = this.state.scenery[this.state.scenery.length - 1].endYear;
        this.yearEmitter$ = zip(
            range(startYear, end - startYear),
            timer(0, 300),
            (val, _) => val
        );

    }

    private setVideoAt(year: number) {
        this.initYearEmitter(year);

        if (this.yearSubscription) {
            this.yearSubscription.unsubscribe();
        }
        this.yearOnMapChange$.next(year);
        this.setState({ currentYear: year });
        if (!this.state.paused) {
            this.resume();
        }
    }

    private resume() {
        this.setState({
            paused: false
        }, () => this.makeControlBarAppear());

        if (this.yearSubscription && !this.yearSubscription.closed) {
            this.yearSubscription.unsubscribe();

        }
        this.yearSubscription = this.yearEmitter$.subscribe(y => {
            this.setState({ currentYear: y });
            this.yearOnMapChange$.next(y);
        }
        );
    }

    private getCurrentScene() {
        return this.state.scenery.find(s => !s.isOutdated(this.state.currentYear));
    }
}