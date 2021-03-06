import React, { RefObject } from 'react';
import './ControlBar.css';

interface Props {
    year: number;
    paused: boolean;
    start:number;
    end:number;
    onPause: () => void;
    onYearChange: (newYear: number) => void;
    toggleFullScreen : () => void;
    videoIsFullScreen : boolean;
    hidden : boolean;
}
interface State{
    progressBarPressed : boolean;
}
export class ControlBar extends React.Component<Props, State>{
    private progressBarRef : RefObject<HTMLDivElement>;
    private bodyHammer : HammerManager;
    private controlBarHammer : HammerManager;
    constructor(props : Props){
        super(props);
        this.progressBarRef = React.createRef();

        this.state = {
            progressBarPressed : false
        };

    }


    render() {
        return (
            <div className={'control-bar '+(this.props.hidden?'hidden':'')}>
                <div className="bg-gradient">

                </div>
                <div className="progress-bar-container"
                ref={this.progressBarRef}
                 onClick={e=> this.handleMouseDown(e)}>
                    <div className={"progress-bar"+(this.state.progressBarPressed?' pressed-bar':'')}>
                        <div className="accomplished-progress" style={({width : `${this.computeProgress()}%`})}></div>
                    </div>
                </div>
                <div className="buttons-container">
                    <div className="play-pause-button" onClick={() =>this.props.onPause()}>
                        {
                            this.props.paused?
                            (
                                <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                                    <path
                                        className="play-button"
                                        d="M
                                        12,26
                                        25,18
                                        12,10 z">
                                    </path>
                                </svg>

                            ):
                            (
                                <svg height="100%" version="1.1" viewBox="0 0 36 36" >
                                    <path  d="M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z"></path>
                                </svg>
                            )
                        }
                    </div>
                    <div className="full-screen-button" onClick={this.props.toggleFullScreen}>
                        {
                            this.props.videoIsFullScreen?
                            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                                <path  d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z" ></path>
                                <path  d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z" ></path>
                                <path  d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z" ></path>
                                <path  d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z" ></path>
                            </svg>
                            :
                            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                                    <path  d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z" ></path>
                                    <path d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z" ></path>
                                    <path d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path>
                                <path d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z" ></path>
                            </svg>

                        }
                    </div>
                </div>
            </div>
        );
    }

    handlePan(e : HammerInput){
        if(this.state.progressBarPressed){
            if(e.eventType===Hammer.INPUT_END){
                this.setState({
                    progressBarPressed : false
                });
            }
            const clientX =e.pointers[0].clientX;
            this.computeYearAndEmit(clientX);
        }
    }
    computeProgress():number{
        const totalYears = this.props.end - this.props.start -1;
        const elapsedYears = this.props.year - this.props.start;
        return 100*elapsedYears/totalYears;
    }

    componentDidMount(){
        this.bodyHammer = new Hammer(document.querySelector('body'));
        this.bodyHammer.on('pan', (e: HammerInput) => this.handlePan(e));
        this.controlBarHammer = new Hammer(document.querySelector('.progress-bar-container'));
        this.controlBarHammer.on('pan', e => {
            if(e.eventType!==Hammer.INPUT_END){

                this.setState({progressBarPressed : true});
            }
        });


    }
    componentWillUnmount(){
        this.bodyHammer.destroy();
    }


    computeYearAndEmit(eventX:number){
        const boundingRect = this.progressBarRef.current.getBoundingClientRect();
        const progress = (eventX - boundingRect.left)/boundingRect.width;
        let year = Math.floor((this.props.end - this.props.start)*progress + this.props.start);
        year = Math.max(this.props.start, year);
        year=Math.min(this.props.end-1, year);
        this.props.onYearChange(year);

    }

    handleMouseDown(event : React.MouseEvent<HTMLDivElement, MouseEvent>){
        this.setState({
            progressBarPressed : true
        });
        if(!this.props.paused){
            this.props.onPause();
        }
        this.computeYearAndEmit(event.clientX);
    }
}