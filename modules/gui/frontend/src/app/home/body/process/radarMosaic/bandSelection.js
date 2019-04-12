import {Field, form} from 'widget/form'
import {RecipeActions} from 'app/home/body/process/mosaic/mosaicRecipe'
import {isMobile} from 'widget/userAgent'
import {msg} from 'translate'
import {selectFrom} from 'stateUtils'
import {withRecipe} from 'app/home/body/process/recipeContext'
import Combo from 'widget/combo'
import React from 'react'
import _ from 'lodash'
import styles from './bandSelection.module.css'

const fields = {
    selection: new Field()
}

const mapRecipeToProps = recipe => {
    const values = selectFrom(recipe, 'ui.bands') || {}
    const timeScan = !selectFrom(recipe, 'model.dates').targetDate
    return {
        recipeId: recipe.id,
        timeScan,
        values
    }
}

class BandSelection extends React.Component {
    state = {}
    bandOptions = [{
        value: 'VV, VH, VV_VH',
        bandLabels: [
            'VV',
            'VH',
            'VV/VH'
        ],
        timeScan: false,
        pointInTime: true
    }, {
        value: 'VV_p50, VH_p50, VV_p80_p20',
        bandLabels: [
            <span key='VV50'>VV<sub>50</sub></span>,
            <span key='VH50'>VH<sub>50</sub></span>,
            <span key='VV80VH20'>VV<sub>80</sub>/VH<sub>20</sub></span>
        ],
        timeScan: true,
        pointInTime: false
    }, {
        value: 'VV_p50, VH_p50, VV_p50_VH_p50',
        bandLabels: [
            <span key='VV50'>VV<sub>50</sub></span>,
            <span key='VH50'>VH<sub>50</sub></span>,
            <span key='VV50VH50'>VV<sub>50</sub>/VH<sub>50</sub></span>
        ],
        timeScan: true,
        pointInTime: false
    }, {
        value: 'VV_p80, VV_p20, VV_p80_p20',
        bandLabels: [
            <span key='VV80'>VV<sub>80</sub></span>,
            <span key='VV20'>VV<sub>20</sub></span>,
            <span key='VV80VV20'>VV<sub>80</sub>/VV<sub>20</sub></span>
        ],
        timeScan: true,
        pointInTime: false
    }, {
        value: 'VV_p20, VH_p20, VV_p80_p20',
        bandLabels: [
            <span key='VV20'>VV<sub>20</sub></span>,
            <span key='VH20'>VH<sub>20</sub></span>,
            <span key='VV80VV20'>VV<sub>80</sub>/VV<sub>20</sub></span>
        ],
        timeScan: true,
        pointInTime: false
    }]
    metaDataOptions = [
        {value: 'dayOfYear', label: msg('bands.dayOfYear'), timeScan: true, pointInTime: true},
        {value: 'daysFromTarget', label: msg('bands.daysFromTarget'), timeScan: true, pointInTime: true}
    ]
    optionByValue = {}

    constructor(props) {
        super(props)
        const {recipeId} = props
        this.recipeActions = RecipeActions(recipeId)
        const options = [...this.bandOptions, ...this.metaDataOptions]
        options.forEach(option => {
            this.optionByValue[option.value] = option
        })
    }

    render() {
        const {timeScan, inputs: {selection}} = this.props
        if (!selection.value)
            return null
        const bandOptions = this.getBandOptions()
        const options = timeScan
            ? bandOptions
            : [
                {label: msg('process.mosaic.bands.combinations'), options: bandOptions},
                {label: msg('process.mosaic.bands.metadata'), options: this.metaDataOptions},
            ]
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    {this.state.showSelector
                        ? <BandSelector
                            recipeActions={this.recipeActions}
                            selection={selection}
                            options={options}
                            onChange={() => this.setSelectorShown(false)}/>
                        : <SelectedBands
                            selectedOption={this.optionByValue[selection.value]}
                            onClick={() => this.setSelectorShown(true)}/>
                    }
                </div>
            </div>
        )
    }

    componentDidUpdate() {
        const {timeScan, inputs: {selection}} = this.props
        const option = this.optionByValue[selection.value]
        const validOption = option && (timeScan ? option.timeScan : option.pointInTime)
        if (!validOption) {
            const bandOptions = this.getBandOptions()
            const value = bandOptions[0].value
            selection.set(value)
            this.recipeActions.setBands(value).dispatch()
        }
    }

    getBandOptions() {
        const {timeScan} = this.props
        const bandOptions = this.bandOptions
            .filter(option => timeScan ? option.timeScan : option.pointInTime)
        bandOptions.forEach(option => {
            option.label =
                option.bandLabels.map((bandLabel, i) =>
                    <React.Fragment key={i}>{bandLabel}{i < option.bandLabels.length - 1 ? ', ' : ''}</React.Fragment>
                )
        })
        return bandOptions
    }

    setSelectorShown(shown) {
        this.setState(prevState =>
            ({...prevState, showSelector: shown})
        )
    }
}

const BandSelector = ({recipeActions, selection, options, onChange}) =>
    <form>
        <Combo
            input={selection}
            placeholder={msg('process.mosaic.bands.placeholder')}
            options={options}
            autoFocus={!isMobile()}
            placement='above'
            keepOpen
            onBlur={onChange}
            onChange={option => {
                recipeActions.setBands(option ? option.value : null).dispatch()
                onChange()
            }}/>
    </form>

const SelectedBands = ({selectedOption, onClick}) => {
    const selection = selectedOption.label
    if (!selection)
        return null
    const bandList = selectedOption.bandLabels || [selectedOption.label]
    const bandClasses = bandList.length === 1
        ? ['single']
        : ['red', 'green', 'blue']
    const bandElements = _.zip(bandList, bandClasses).map(([band, className]) =>
        <div key={className} className={styles[className]} onClick={onClick}>
            {band}
        </div>
    )
    return (
        <div className={styles.selection}>
            <div className={styles.selectedBands}>
                {bandElements}
            </div>
        </div>
    )

}

export default withRecipe(mapRecipeToProps)(
    form({fields})(
        BandSelection
    )
)
