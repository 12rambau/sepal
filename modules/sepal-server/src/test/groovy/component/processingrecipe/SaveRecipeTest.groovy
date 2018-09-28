package component.processingrecipe

class SaveRecipeTest extends RecipeTest {
    def 'When saving, it can be loaded'() {
        clock.set()
        def recipe = newRecipe()

        when:
        saveRecipe(recipe)

        then:
        getRecipeById(recipe.id) == recipe
    }

    def 'When saving, type version is set'() {
        clock.set()
        def recipe = newRecipe()

        when:
        saveRecipe(recipe)

        then:

        getRecipeById(recipe.id).typeVersion == currentTypeVersion
    }
}
