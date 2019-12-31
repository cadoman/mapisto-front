import { MapDomManager } from "./MapDomManager";
import { Subject } from "rxjs";
import Hammer from 'hammerjs'
export class MapNavigator {
    private domManager: MapDomManager
    private draggingSubject: Subject<void>
    private absoluteDragStartPoint: DOMPoint
    private svgDragStartPoint: DOMPoint;
    private dragging: boolean;

    private zoomSubject: Subject<void>

    constructor(domManager: MapDomManager) {
        this.domManager = domManager
        this.draggingSubject = new Subject<void>();
        this.zoomSubject = new Subject<void>();
        // this.domManager.getListener('mousedown').subscribe(event => this.startDragging(event as MouseEvent));
        // this.domManager.getListener('mouseup').subscribe(() => this.endDragging());
        // this.domManager.getListener('mouseleave').subscribe(() => this.endDragging());
        // this.domManager.getListener('mousemove').subscribe((event) => this.handleDrag(event as MouseEvent));

        this.domManager.getListener('wheel').subscribe(zoomEvent => this.handleWheel(zoomEvent as WheelEvent))

        const ham = new Hammer(this.domManager.getNativeContainer(), {
            touchAction : 'none'
        });
        ham.on('pan', (e: HammerInput) => {
            if (!this.dragging) {
                this.dragging = true;
                this.svgDragStartPoint = this.domManager.svgCoords(e.center.x, e.center.y)
                this.absoluteDragStartPoint = new DOMPoint(e.center.x, e.center.y)
            }
            const targetPoint = new DOMPoint(this.absoluteDragStartPoint.x + e.deltaX, this.absoluteDragStartPoint.y + e.deltaY);    
            const targetOnMap = this.domManager.svgCoords(targetPoint.x, targetPoint.y)
            const svgDeltaX = this.svgDragStartPoint.x - targetOnMap.x
            const svgDeltaY = this.svgDragStartPoint.y - targetOnMap.y
            this.domManager.shiftViewBox(svgDeltaX , svgDeltaY )
            this.draggingSubject.next();
            if (e.isFinal) {
                this.dragging = false;
                this.absoluteDragStartPoint = undefined
                console.log('stop drag')
            }
        })
        ham.get('pinch').set({
            enable : true
        })
        ham.on('pinch', (e:HammerInput) =>this.handlePinch(e));
    }

    getDragListener() {
        return this.draggingSubject.asObservable();
    }

    getZoomListener() {
        return this.zoomSubject.asObservable();
    }

    private startDragging(event: MouseEvent) {

        this.svgDragStartPoint = this.domManager.getEventCoords(event);
        this.dragging = true
    }

    private endDragging() {
        this.dragging = false;
    }

    private handleDrag(event: MouseEvent) {
        if (!this.dragging) {
            return
        }
        let targetPoint = this.domManager.getEventCoords(event);
        this.domManager.shiftViewBox(this.svgDragStartPoint.x - targetPoint.x,
            this.svgDragStartPoint.y - targetPoint.y);
        this.draggingSubject.next();
    }

    private handlePinch(event : HammerInput){
        this.doZoom(event.center.x, event.center.y,  -Math.log(event.scale))
    }


    private doZoom(targetX : number, targetY:number, direction: number){
        const minSideSize = 10; // the maps viewbox width or height cannot be inferior to 10 points
        const scrollSpeed = 2;
        const vb = this.domManager.getViewBox()

        const visibleSVG = this.domManager.getVisibleSVG()

        const width = visibleSVG.end.x - visibleSVG.origin.x
        const height = visibleSVG.end.y - visibleSVG.origin.y
        const target = this.domManager.svgCoords(targetX, targetY);

        const scrollFactor = -this.getNormalizedDelta(direction) * scrollSpeed / 100

        const dw = width * scrollFactor
        const dh = height * scrollFactor
        const xratio = (target.x - visibleSVG.origin.x) / width
        const yratio = (target.y - visibleSVG.origin.y) / height;
        const dx = dw * xratio;
        const dy = dh * yratio;
        if (vb.width - dw >= minSideSize && vb.height - dh >= minSideSize) {

            this.domManager.setViewBox(
                vb.x + dx,
                vb.y + dy,
                vb.width - dw,
                vb.height - dh
            )
            this.zoomSubject.next();
        } else {
            console.log('zoom was forbidden')
        }

    }

    private handleWheel(event: WheelEvent) {

        this.doZoom(event.x, event.y, event.deltaY);
    }

    private getNormalizedDelta(deltaY : number) {
        return ( deltaY > 0) ? 1 : -1;
    }





}