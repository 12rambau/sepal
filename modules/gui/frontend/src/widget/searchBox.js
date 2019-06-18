import {Shape} from 'widget/shape'
import {Subject} from 'rxjs'
import {compose} from 'compose'
import {debounceTime} from 'rxjs/operators'
import {isMobile} from 'widget/userAgent'
import Keybinding from 'widget/keybinding'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import escapeStringRegexp from 'escape-string-regexp'
import styles from './searchBox.module.css'
import withSubscriptions from 'subscription'

class _SearchBox extends React.Component {
    ref = React.createRef()
    search$ = new Subject()

    state = {
        value: ''
    }

    render() {
        const {placeholder} = this.props
        const {value} = this.state
        return (
            <Keybinding keyMap={{
                Escape: () => this.setValue('')
            }}>
                <Shape
                    look='transparent'
                    size='large'
                    shape='pill'
                    icon='search'>
                    <input
                        className={styles.search}
                        type='search'
                        ref={this.ref}
                        value={value}
                        placeholder={placeholder}
                        autoFocus={!isMobile()}
                        onChange={e => this.setValue(e.target.value)}
                    />
                </Shape>
            </Keybinding>
        )
    }

    setValue(value) {
        this.setState({value})
        this.search$.next(value)
    }

    componentDidMount() {
        const {onSearchValue, onSearchValues, debounce, addSubscription} = this.props
        addSubscription(
            this.search$.pipe(
                debounceTime(debounce)
            ).subscribe(
                value => {
                    onSearchValue && onSearchValue(value)
                    onSearchValues && onSearchValues(
                        _.chain(value.split(/\s+/))
                            .map(filter => escapeStringRegexp(filter.trim()))
                            .compact()
                            .value()
                    )
                }
            )
        )
    }
}

const SearchBox = compose(
    _SearchBox,
    withSubscriptions()
)

SearchBox.propTypes = {
    debounce: PropTypes.number,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onSearchValue: PropTypes.func,
    onSearchValues: PropTypes.func
}

SearchBox.defaultProps = {
    debounce: 250
}

export default SearchBox
