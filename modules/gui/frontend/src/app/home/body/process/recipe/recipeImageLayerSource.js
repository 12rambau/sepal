import {compose} from 'compose'
import {connect} from 'store'
import {createAoiFeatureLayerSource} from 'app/home/map/aoiFeatureLayerSource'
import {createGoogleSatelliteImageLayerSource} from 'app/home/map/imageLayerSource/googleSatelliteImageLayerSource'
import {createLabelsFeatureLayerSource} from 'app/home/map/labelsFeatureLayerSource'
import {createNicfiPlanetImageLayerSource} from 'app/home/map/imageLayerSource/planetImageLayerSource'
import {msg} from 'translate'
import {recipeAccess} from '../recipeAccess'
import {recipeActionBuilder} from '../recipe'
import {selectFrom} from 'stateUtils'
import {withRecipe} from '../recipeContext'
import Notifications from 'widget/notifications'
import PropTypes from 'prop-types'
import React from 'react'
import guid from 'guid'

const mapStateToProps = (state, {source: {sourceConfig: {recipeId}}}) => ({
    recipe: selectFrom(state, ['process.loadedRecipes', recipeId])
})

class _RecipeImageLayerSource extends React.Component {
    render() {
        return null
    }

    componentDidMount() {
        this.loadRecipe()
    }

    componentDidUpdate(prevProps) {
        const {recipe: prevRecipe} = prevProps
        const {stream, recipe} = this.props
        if (!stream('LOAD_RECIPE').active && (!recipe || recipe.id !== prevRecipe.id)) {
            this.loadRecipe()
        }
        if (recipe && toDescription(recipe) !== toDescription(prevRecipe)) {
            this.updateSourceConfig(recipe)
        }
    }

    loadRecipe() {
        const {stream, source: {sourceConfig: {recipeId}}, loadRecipe$} = this.props
        stream('LOAD_RECIPE',
            loadRecipe$(recipeId),
            recipe => this.updateSourceConfig(recipe),
            error => Notifications.error({message: msg('imageLayerSources.Recipe.loadError', {error}), error})
        )
    }

    updateSourceConfig(recipe) {
        const {recipeId, source, recipeActionBuilder} = this.props
        const description = toDescription(recipe)
        if (recipeId !== source.sourceConfig.recipeId) {
            recipeActionBuilder('UPDATE_RECIPE_IMAGE_LAYER_SOURCE', {description})
                .set(['layers.additionalImageLayerSources', {id: source.id}, 'sourceConfig.description'], description)
                .dispatch()
        }
    }
}

export const RecipeImageLayerSource = compose(
    _RecipeImageLayerSource,
    connect(mapStateToProps),
    withRecipe(),
    recipeAccess()
)

RecipeImageLayerSource.propTypes = {
    source: PropTypes.object.isRequired
}

export const initializeLayers = (recipeId, savedLayers, additionalFeatureLayerSources = []) => {
    const recipeImageLayerSource = createCurrentRecipeImageLayerSource(recipeId)
    const planetImageLayerSource = createNicfiPlanetImageLayerSource()
    const googleSatelliteImageLayerSource = createGoogleSatelliteImageLayerSource()
    const imageLayerSources = [
        recipeImageLayerSource,
        planetImageLayerSource,
        googleSatelliteImageLayerSource
    ]

    const aoiLayerSource = createAoiFeatureLayerSource()
    const labelsLayerSource = createLabelsFeatureLayerSource()
    const featureLayerSources = [
        aoiLayerSource,
        labelsLayerSource,
        ...additionalFeatureLayerSources
    ]
    const layers = savedLayers || {
        areas: {
            'center': {
                id: guid(),
                imageLayer: {
                    sourceId: recipeImageLayerSource.id
                },
                featureLayers: [
                    {sourceId: aoiLayerSource.id}
                ]
            }
        },
        mode: 'stack'
    }
    const actionBuilder = recipeActionBuilder(recipeId)
    actionBuilder('INITIALIZE_LAYER_SOURCES')
        .setAll({
            'ui.imageLayerSources': imageLayerSources,
            'ui.featureLayerSources': featureLayerSources,
            layers,
        })
        .dispatch()
}

const createCurrentRecipeImageLayerSource = recipeId => ({
    id: 'this-recipe',
    type: 'Recipe',
    sourceConfig: {
        recipeId,
        description: msg('imageLayerSources.Recipe.thisRecipeDescription'),
    }
})

const toDescription = recipe =>
    recipe && (recipe.title || recipe.placeholder)
