import {Form} from 'widget/form/form'
import {Layout} from 'widget/layout'
import {Panel} from 'widget/panel/panel'
import {breakDetectionOptions, RecipeActions} from '../../ccdcRecipe'
import {RecipeFormPanel, recipeFormPanel} from 'app/home/body/process/recipeFormPanel'
import {compose} from 'compose'
import {msg} from 'translate'
import React from 'react'
import styles from './options.module.css'
import {Button} from 'widget/button'
import _ from 'lodash'
import {selectFrom} from '../../../../../../../stateUtils'
import {opticalBandOptions, radarBandOptions} from '../../bandOptions'

const J_DAYS = 0
const FRACTIONAL_YEARS = 1
const UNIX_TIME_MILLIS = 2

const fields = {
    advanced: new Form.Field(),
    breakDetection: new Form.Field(),
    dateFormat: new Form.Field()
        .predicate(selection => selection >= 0, 'process.ccdc.panel.options.form.dateFormat.required'),
    tmaskBands: new Form.Field()
        .predicate(selection => selection ? [0, 2].includes(selection.length) : true, 'process.ccdc.panel.options.form.tmaskBands.noneOrTwo'),
    minObservations: new Form.Field(),
    chiSquareProbability: new Form.Field(),
    minNumOfYearsScaler: new Form.Field(),
    lambda: new Form.Field(),
    maxIterations: new Form.Field()
}

const mapRecipeToProps = recipe => ({
    sources: selectFrom(recipe, 'model.sources')
})

class Options extends React.Component {
    constructor(props) {
        super(props)
        this.recipeActions = RecipeActions(props.recipeId)
    }

    render() {
        const {inputs: {advanced}} = this.props
        return (
            <RecipeFormPanel
                className={advanced.value ? styles.advanced : styles.simple}
                placement='bottom-right'>
                <Panel.Header
                    icon='cog'
                    title={msg('process.ccdc.panel.options.title')}/>
                <Panel.Content>
                    {advanced.value ? this.renderAdvanced() : this.renderSimple()}
                </Panel.Content>
                <Form.PanelButtons>
                    <Button
                        label={advanced.value ? msg('button.less') : msg('button.more')}
                        onClick={() => this.setAdvanced(!advanced.value)}/>
                </Form.PanelButtons>
            </RecipeFormPanel>
        )
    }

    renderAdvanced() {
        const {sources, inputs: {dateFormat, tmaskBands, minObservations, chiSquareProbability, minNumOfYearsScaler, lambda, maxIterations}} = this.props
        const dataSets = sources.dataSets
        const tmaskBandsOptions = (_.isEmpty(dataSets['SENTINEL_1'])
            ? opticalBandOptions({dataSets})
            : radarBandOptions({}))
            .map(group => group.options)
            .flat()
            .filter(({value}) => sources.breakpointBands.includes(value))
        return (
            <Layout>
                <Form.Buttons
                    label={msg('process.ccdc.panel.dates.form.dateFormat.label')}
                    input={dateFormat}
                    multiple={false}
                    options={[
                        {
                            value: J_DAYS,
                            label: msg('process.ccdc.panel.dates.form.dateFormat.jDays.label'),
                            tooltip: msg('process.ccdc.panel.dates.form.dateFormat.jDays.tooltip')
                        },
                        {
                            value: FRACTIONAL_YEARS,
                            label: msg('process.ccdc.panel.dates.form.dateFormat.fractionalYears.label'),
                            tooltip: msg('process.ccdc.panel.dates.form.dateFormat.fractionalYears.tooltip')
                        },
                        {
                            value: UNIX_TIME_MILLIS,
                            label: msg('process.ccdc.panel.dates.form.dateFormat.unixTimeMillis.label'),
                            tooltip: msg('process.ccdc.panel.dates.form.dateFormat.unixTimeMillis.tooltip')
                        }
                    ]}
                />
                <Form.Buttons
                    label={msg('process.ccdc.panel.options.form.tmaskBands.label')}
                    input={tmaskBands}
                    multiple={true}
                    disabled={tmaskBandsOptions.length < 2}
                    options={tmaskBandsOptions}
                    errorMessage
                />
                <Form.Input
                    label={msg('process.ccdc.panel.options.form.minObservations')}
                    input={minObservations}
                />
                <Form.Input
                    label={msg('process.ccdc.panel.options.form.chiSquareProbability')}
                    input={chiSquareProbability}
                />
                <Form.Input
                    label={msg('process.ccdc.panel.options.form.minNumOfYearsScaler')}
                    input={minNumOfYearsScaler}
                />
                <Form.Input
                    label={msg('process.ccdc.panel.options.form.lambda')}
                    input={lambda}
                />
                <Form.Input
                    label={msg('process.ccdc.panel.options.form.maxIterations')}
                    input={maxIterations}
                />
            </Layout>
        )
    }

    renderSimple() {
        const {inputs: {breakDetection}} = this.props
        return (
            <Layout>
                <Form.Buttons
                    label={msg('process.ccdc.panel.options.form.breakDetection.label')}
                    input={breakDetection}
                    multiple={false}
                    options={[
                        {
                            value: 'conservative',
                            label: msg('process.ccdc.panel.options.form.breakDetection.conservative.label'),
                            tooltip: msg('process.ccdc.panel.options.form.breakDetection.conservative.tooltip')
                        },
                        {
                            value: 'moderate',
                            label: msg('process.ccdc.panel.options.form.breakDetection.moderate.label'),
                            tooltip: msg('process.ccdc.panel.options.form.breakDetection.moderate.tooltip')
                        },
                        {
                            value: 'aggressive',
                            label: msg('process.ccdc.panel.options.form.breakDetection.aggressive.label'),
                            tooltip: msg('process.ccdc.panel.options.form.breakDetection.aggressive.tooltip')
                        }
                    ]}
                />
            </Layout>
        )
    }

    setAdvanced(enabled) {
        const {inputs: {advanced, breakDetection}} = this.props
        const values = breakDetectionOptions[breakDetection.value]
        if (values) {
            Object.keys(values).forEach(field => this.props.inputs[field].set(values[field]))
        }
        advanced.set(enabled)
    }
}

Options.propTypes = {}

const valuesToModel = values => {
    if (values.advanced) {
        return {
            dateFormat: values.dateFormat,
            tmaskBands: values.tmaskBands,
            minObservations: parseInt(values.minObservations),
            chiSquareProbability: parseFloat(values.chiSquareProbability),
            minNumOfYearsScaler: parseFloat(values.minNumOfYearsScaler),
            lambda: parseInt(values.lambda),
            maxIterations: parseInt(values.maxIterations)
        }
    } else {
        return {...breakDetectionOptions[values.breakDetection], dateFormat: FRACTIONAL_YEARS}
    }
}

const modelToValues = model => {
    const breakDetection = modelToBreakDetection(model)
    return ({
        advanced: !breakDetection,
        breakDetection,
        ...model
    })
}

const modelToBreakDetection = model =>
    _.isEmpty(model.tmaskBands) && Object.keys(breakDetectionOptions)
        .find(breakDetection =>
            _.isEqual(breakDetectionOptions[breakDetection], _.omit(model, 'tmaskBands'))
        )

export default compose(
    Options,
    recipeFormPanel({id: 'ccdcOptions', fields, mapRecipeToProps, modelToValues, valuesToModel})
)
