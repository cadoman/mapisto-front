import React from 'react';
import { MapistoTerritory } from 'src/entities/mapistoTerritory';
import { MapistoAPI } from 'src/api/MapistoApi';
import { ViewBoxLike } from '@svgdotjs/svg.js';
import { LoadingIcon } from '../TimeNavigableMap/LoadingIcon';
import { forkJoin, Subscription, interval } from 'rxjs';
import { GifMap } from '../gif-map/GifMap';

interface Props {
    territory: MapistoTerritory;
}
interface State {
    maps: {
        territories: MapistoTerritory[],
        year: number
    }[];
    currentMapIndex: number;
    playing: boolean;
    viewbox: ViewBoxLike;
}
export class FocusedOnTerritoryMap extends React.Component<Props, State>{
    private mapRef: React.RefObject<HTMLDivElement>;
    private timerSubscription: Subscription;
    constructor(props: Props) {
        super(props);
        this.timerSubscription = new Subscription();
        this.mapRef = React.createRef<HTMLDivElement>();
        this.state = {
            playing: false,
            maps: [],
            currentMapIndex: 0,
            viewbox: { x: 0, y: 0, width: 0, height: 0 }

        };
    }

    componentDidMount() {
        this.loadMap();
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.territory.territoryId !== this.props.territory.territoryId) {
            this.loadMap();
        }
    }

    render() {
        return <div ref={this.mapRef}>
            {this.renderMap()}
        </div>;
    }

    renderMap() {
        if (this.state.maps.length) {

            return (
                <GifMap maps={this.state.maps.map(m => ({ ...m, viewbox: this.state.viewbox }))} />
            );
        } else {
            return <LoadingIcon loading={true} />;
        }
    }

    private loadMap() {
        const years = this.generateYearsToDisplay(this.props.territory);
        const pixelWidth = this.mapRef.current.getBoundingClientRect().width;
        forkJoin(years.map(y =>
            MapistoAPI.loadMapForTerritory(this.props.territory.territoryId, y, pixelWidth))).subscribe(
                res => this.setState({
                    maps: res.map((map, index) => ({
                        territories: map.territories,
                        viewbox: map.boundingBox,
                        year: years[index],
                        lands: []
                    })),
                    viewbox: res[0].boundingBox
                })
            );
    }

    private generateYearsToDisplay(territory: MapistoTerritory): number[] {
        const years = [territory.startYear];
        if (territory.endYear > territory.startYear + 1) {
            years.push(territory.endYear - 1);
        }

        return years;

    }
}
