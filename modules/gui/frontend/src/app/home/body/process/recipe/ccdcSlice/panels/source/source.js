import {Form} from 'widget/form/form'
import {RecipeFormPanel, recipeFormPanel} from 'app/home/body/process/recipeFormPanel'
import {SectionSelection} from './sectionSelection'
import {compose} from 'compose'
import {msg} from 'translate'
import AssetSection from './assetSection'
import PanelSections from 'widget/panelSections'
import React from 'react'
import RecipeSection from './recipeSection'
import styles from './source.module.css'

const fields = {
    section: new Form.Field()
        .notBlank(),
    asset: new Form.Field()
        .skip((value, {section}) => section !== 'ASSET')
        .notBlank('process.ccdcSlice.panel.source.form.asset.required'),
    recipe: new Form.Field()
        .skip((value, {section}) => section !== 'RECIPE_REF')
        .notBlank('process.ccdcSlice.panel.source.form.recipe.required'),
    bands: new Form.Field()
        .notEmpty('process.ccdcSlice.panel.source.form.bands.required'),
    dateFormat: new Form.Field()
        .skip((value, {section}) => section !== 'ASSET')
        .notBlank(),
    startDate: new Form.Field(),
    endDate: new Form.Field(),
    surfaceReflectance: new Form.Field()
}

class Source extends React.Component {
    render() {
        return (
            <RecipeFormPanel
                className={styles.panel}
                placement='bottom-right'>
                {this.renderSections()}
            </RecipeFormPanel>
        )
    }

    renderSections() {
        const {recipeId, inputs} = this.props
        const sections = [
            {
                component: <SectionSelection recipeId={recipeId} inputs={inputs}/>
            },
            {
                value: 'RECIPE_REF',
                label: msg('process.ccdcSlice.panel.source.recipe.label'),
                title: msg('process.ccdcSlice.panel.source.recipe.title'),
                component: <RecipeSection inputs={inputs}/>
            },
            {
                value: 'ASSET',
                label: msg('process.ccdcSlice.panel.source.asset.label'),
                title: msg('process.ccdcSlice.panel.source.asset.title'),
                component: <AssetSection inputs={inputs}/>
            }
        ]
        return (
            <PanelSections
                inputs={inputs}
                sections={sections}
                selected={inputs.section}
                icon='cog'
                label={msg('process.ccdcSlice.panel.source.title')}
            />
        )
    }
}

const modelToValues = ({id, type, bands, dateFormat, startDate, endDate, surfaceReflectance}) => {
    const values = {
        section: type || 'SELECTION',
        bands,
        dateFormat,
        startDate,
        endDate,
        surfaceReflectance
    }
    switch (type) {
    case 'RECIPE_REF':
        return {...values, recipe: id}
    case 'ASSET':
        return {...values, asset: id}
    default:
        return values
    }
}

const valuesToModel = ({section, asset, recipe, bands, dateFormat, startDate, endDate, surfaceReflectance}) => {
    const model = {
        type: section,
        bands,
        dateFormat,
        startDate,
        endDate,
        surfaceReflectance
    }
    switch (section) {
    case 'RECIPE_REF':
        return {...model, id: recipe}
    case 'ASSET':
        return {...model, id: asset}
    default:
        return null
    }
}
Source.propTypes = {}

export default compose(
    Source,
    recipeFormPanel({id: 'source', fields, valuesToModel, modelToValues})
)
