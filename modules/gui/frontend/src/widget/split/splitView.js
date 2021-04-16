import {ElementResizeDetector} from 'widget/elementResizeDetector'
import {SplitContext} from './splitContext'
import {SplitHandleCenter} from './splitHandleCenter'
import {SplitHandleHorizontal} from './splitHandleHorizontal'
import {SplitHandleVertical} from './splitHandleVertical'
import {Subject} from 'rxjs'
import {compose} from 'compose'
import {getLogger} from 'log'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import styles from './splitView.module.css'
import withSubscriptions from 'subscription'

const log = getLogger('splitView')

const resize$ = new Subject()

class _SplitView extends React.PureComponent {
    areas = React.createRef()
    centerHandle = React.createRef()
    verticalHandle = React.createRef()
    horizontalHandle = React.createRef()

    state = {
        size: {
            height: undefined,
            width: undefined
        },
        position: {
            x: undefined,
            y: undefined
        },
        enabled: {
            center: false,
            vertical: false,
            horizontal: false,
        },
        dragging: {
            x: false,
            y: false
        },
        initialized: false
    }

    constructor() {
        super()
        this.onDragging = this.onDragging.bind(this)
        this.onPosition = this.onPosition.bind(this)
    }

    render() {
        const {className, maximize, mode} = this.props
        const {position: {x, y}, dragging} = this.state
        return (
            <ElementResizeDetector onResize={size => resize$.next(size)}>
                <SplitContext.Provider value={{container: this.areas.current, mode, maximize}}>
                    <div
                        className={[
                            styles.container,
                            dragging.x || dragging.y ? styles.dragging : null,
                            dragging.x ? styles.x : null,
                            dragging.y ? styles.y : null,
                            styles.initialized,
                            className
                        ].join(' ')}
                        style={{
                            '--x': `${x}px`,
                            '--y': `${y}px`
                        }}>
                        {this.renderAreas()}
                        {this.renderHandles()}
                        {this.renderContent()}
                    </div>
                </SplitContext.Provider>
            </ElementResizeDetector>
        )
    }

    renderAreas() {
        const {areas} = this.props
        return (
            <div className={styles.areas} ref={this.areas}>
                {areas.map(area => this.renderArea(area))}
            </div>
        )
    }

    renderArea({placement, content}) {
        const {mode, maximize} = this.props
        const {initialized} = this.state
        const single = mode === 'stack' && maximize
        const hidden = single && maximize !== placement
        return (
            <div
                key={placement}
                className={_.flatten([
                    styles.area,
                    hidden ? styles.hide : mode === 'stack' ? styles.full : styles.partial,
                    single ? styles.center : placement.split('-').map(placement => styles[placement])
                ]).join(' ')}>
                {initialized ? content : null}
            </div>
        )
    }

    renderHandles() {
        const {areas, maximize} = this.props
        const {enabled: {center, vertical, horizontal}} = this.state
        const placements = _.map(areas, area => area.placement)
        return (
            <div className={[
                styles.handles,
                maximize ? styles.hide : null
            ].join(' ')}>
                {center ? this.renderCenterHandle() : null}
                {vertical ? this.renderVerticalHandle(placements) : null}
                {horizontal ? this.renderHorizontalHandle(placements) : null}
            </div>
        )
    }

    renderCenterHandle() {
        const {position, size} = this.state
        return (
            <SplitHandleCenter
                position={position}
                size={size}
                onDragging={this.onDragging}
                onPosition={this.onPosition}
            />
        )
    }

    renderVerticalHandle(placements) {
        const {position, size} = this.state
        return (
            <SplitHandleVertical
                placements={placements}
                position={position}
                size={size}
                onDragging={this.onDragging}
                onPosition={this.onPosition}
            />
        )
    }

    renderHorizontalHandle(placements) {
        const {position, size} = this.state
        return (
            <SplitHandleHorizontal
                placements={placements}
                position={position}
                size={size}
                onDragging={this.onDragging}
                onPosition={this.onPosition}
            />)
    }

    onDragging(dragging) {
        this.setState({dragging})
    }

    onPosition(position) {
        this.setState({position})
    }

    renderContent() {
        const {children} = this.props
        return (
            <div className={styles.content}>
                {children}
            </div>
        )
    }

    static getDerivedStateFromProps(props) {
        const {areas} = props

        const hasSplit = (areas, nonSplitPlacements) =>
            _.some(areas, ({placement}) =>
                !nonSplitPlacements.includes(placement)
            )

        const calculateSplit = areas => {
            const areaCount = areas.length
            if (areaCount > 2) {
                return {
                    vertical: true,
                    horizontal: true,
                    center: true
                }
            }
            if (areaCount === 2) {
                return {
                    vertical: hasSplit(areas, ['center', 'top', 'bottom']),
                    horizontal: hasSplit(areas, ['center', 'left', 'right']),
                    center: true
                }
            }
            return {
                vertical: false,
                horizontal: false,
                center: false
            }
        }

        return {
            enabled: calculateSplit(areas)
        }
    }

    componentDidMount() {
        this.initializeResizeDetector()
    }

    initializeResizeDetector() {
        const {addSubscription} = this.props
        addSubscription(
            resize$.subscribe(size =>
                this.setState({
                    size,
                    position: {
                        x: size.width / 2,
                        y: size.height / 2
                    },
                    initialized: true
                })
            )
        )
    }
}

export const SplitView = compose(
    _SplitView,
    withSubscriptions()
)

SplitView.propTypes = {
    areas: PropTypes.arrayOf(
        PropTypes.shape({
            content: PropTypes.any.isRequired,
            placement: PropTypes.oneOf(['center', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']).isRequired,
            className: PropTypes.string,
            view: PropTypes.any
        })
    ),
    children: PropTypes.any,
    className: PropTypes.string,
    maximize: PropTypes.string,
    mode: PropTypes.oneOf(['stack', 'grid'])
}

SplitView.defaultProps = {
    mode: 'stack'
}