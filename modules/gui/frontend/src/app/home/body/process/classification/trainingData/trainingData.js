import {Form} from 'widget/form/form'
import {Layout} from 'widget/layout'
import {Msg, msg} from 'translate'
import {Panel} from 'widget/panel/panel'
import {RecipeActions} from '../classificationRecipe'
import {RecipeFormPanel, recipeFormPanel} from 'app/home/body/process/recipeFormPanel'
import {Subject} from 'rxjs'
import {compose} from 'compose'
import {loadFusionTableColumns$} from 'app/home/map/fusionTable'
import {map, takeUntil} from 'rxjs/operators'
import {selectFrom} from 'stateUtils'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './trainingData.module.css'

const fields = {
    fusionTable: new Form.Field()
        .notBlank('process.classification.panel.trainingData.form.fusionTable.required'),
    fusionTableColumn: new Form.Field()
        .notBlank('process.classification.panel.trainingData.form.fusionTableColumn.required')
}

const mapRecipeToProps = recipe => ({
    columns: selectFrom(recipe, 'ui.fusionTable.columns')
})

class TrainingData extends React.Component {
    constructor(props) {
        super(props)
        this.fusionTableChanged$ = new Subject()
        this.recipeActions = RecipeActions(props.recipeId)
    }

    loadFusionTableColumns(fusionTableId) {
        const {asyncActionBuilder, inputs: {fusionTableColumn}} = this.props
        asyncActionBuilder('LOAD_FUSION_TABLE_COLUMNS',
            loadFusionTableColumns$(fusionTableId, {includedTypes: ['NUMBER']}).pipe(
                map(response => {
                    if (response.error)
                        this.props.inputs.fusionTable.setInvalid(
                            msg(response.error.key)
                        )
                    return (response.columns || [])
                        .filter(column => column.type !== 'LOCATION')
                }),
                map(columns => columns.map(({name}) => ({value: name, label: name}))),
                map(columns => {
                    const defaultColumn = columns.length === 1 ? columns[0] : columns.find(column => column.value === 'class')
                    if (defaultColumn)
                        fusionTableColumn.set(defaultColumn.value)
                    return this.recipeActions.setFusionTableColumns(columns)
                }),
                takeUntil(this.fusionTableChanged$))
        )
            .dispatch()
    }

    render() {
        const {recipeId} = this.props
        return (
            <RecipeFormPanel
                placement='bottom-right'
                className={styles.panel}
                onClose={() => RecipeActions(recipeId).showPreview().dispatch()}>
                <Panel.Header
                    icon='cog'
                    title={msg('process.classification.panel.trainingData.title')}/>

                <Panel.Content>
                    {this.renderContent()}
                </Panel.Content>

                <Form.PanelButtons/>
            </RecipeFormPanel>
        )
    }

    renderContent() {
        const {action, columns, inputs: {fusionTable, fusionTableColumn}} = this.props
        const columnState = action('LOAD_FUSION_TABLE_COLUMNS').dispatching
            ? 'loading'
            : columns && columns.length > 0
                ? 'loaded'
                : 'noFusionTable'
        return (
            <Layout>
                <Form.Input
                    label={msg('process.classification.panel.trainingData.form.fusionTable.label')}
                    autoFocus
                    input={fusionTable}
                    placeholder={msg('process.classification.panel.trainingData.form.fusionTable.placeholder')}
                    spellCheck={false}
                    onChange={e => {
                        fusionTableColumn.set('')
                        this.recipeActions.setFusionTableColumns(null).dispatch()
                        this.fusionTableChanged$.next()
                        const fusionTableMinLength = 30
                        if (e && e.target.value.length > fusionTableMinLength)
                            this.loadFusionTableColumns(e.target.value)
                    }}
                    errorMessage
                />
                <Form.Combo
                    label={msg('process.classification.panel.trainingData.form.fusionTableColumn.label')}
                    input={fusionTableColumn}
                    busy={action('LOAD_FUSION_TABLE_COLUMNS').dispatching}
                    disabled={!columns || columns.length === 0}
                    placeholder={msg(`process.classification.panel.trainingData.form.fusionTableColumn.placeholder.${columnState}`)}
                    options={columns || []}
                />
                <p>
                    <a href='/ceo' target='_blank'><Msg
                        id='process.classification.panel.trainingData.form.openCeo'/></a>
                </p>
            </Layout>
        )
    }

    componentDidMount() {
        const {recipeId, inputs: {fusionTable}} = this.props
        if (fusionTable.value)
            this.loadFusionTableColumns(fusionTable.value)
        RecipeActions(recipeId).hidePreview().dispatch()
    }
}

TrainingData.propTypes = {
    recipeId: PropTypes.string
}

export default compose(
    TrainingData,
    recipeFormPanel({id: 'trainingData', fields, mapRecipeToProps})
)
