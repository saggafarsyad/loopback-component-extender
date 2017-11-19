/**
 * Loopback Component for Extending Built-in Model
 *
 * A component to extend Loopback built-in Model (User, AccessToken, etc.)
 * without creating new Model. ModelExtender loads Model definition
 * synchronously.
 *
 * @author Saggaf Arsyad <saggaf.arsyad@gmail.com>
 * @since 2017/11/08
 */

'use strict'

// Import dependencies
const kebabCase = require('lodash.kebabcase')
const path = require('path')

// Init logger
const debug = require('debug')('loopback:component:built-in-model-extender')

module.exports = (app, {models, options}) => {
  // Init options
  if (!options)
    options = {}
  // If model name is a string, convert to object and put inside an array
  if (typeof models === 'string') {
    models = [{name: models}]
  } else if (Array.isArray(models)) {
    models = models.map(model => {
      // If model is string, convert to object
      if (typeof model === 'string')
        model = {name: model}
      // If global folder path is set and model is unset, set folder path
      if (options.folderPath && !model.folderPath)
        model.folderPath = options.folderPath
      // Continue
      return model
    })
  }
  // Debug
  debug('Models to be extended: %O', models)
  // Iterate model definitions and extend
  let len = models.length
  for (let i = 0; i < len; i++) {
    let model = models[i]
    let Model = app.models[model.name]
    // Extend
    extendModel(Model, model.options)
  }
}

/**
 * Load extended built-in model definition and method file
 *
 * @param {Object} Model Model instance
 * @param {Object} options Loader options
 * @param {string} folderPath Folder path relative to project root
 * @param {string} fileName Extended model file name
 * @param {string} filePath File path relative to project root
 */
const extendModel = (Model, options) => {
  // Get model name
  let modelName = Model.modelName
  // Init options
  if (!options) options = {}
  // Get definition file path
  let filePath
  // If file path is set, retrieve from file path
  if (options.filePath)
    filePath = options.filePath
  else {
    // Get folder path. If unset, use 'common/models'
    let folderPath = options.folderPath || './common/models'
    // Get file name, if unset, convert model name to kebab case and add '-x'
    let fileName = options.fileName || kebabCase(modelName.toLowerCase()) + '-x'
    // Resolve file path
    filePath = path.resolve(folderPath, fileName)
  }
  // Load definition
  let definitions = require(filePath + '.json')
  // Extend properties
  let keys = Object.keys(definitions)
  let len = keys.length
  for (let i = 0; i < len; i++) {
    // Get key name
    let key = keys[i]
    // Validate key
    // -- If key is name, skip
    if (key === 'name' || key === 'base')
      continue
    // Get model attribute definition
    let def = definitions[key]
    // If key is properties, extend properties
    if (key === 'properties') extendProperties(Model, def)
    // If key is relations, extend relations
    if (key === 'relations') extendRelations(Model, def)
    // If key is mixins, extend mixins
    else if (key === 'mixins') extendMixins(Model, def)
    // Else, merge definitions
    else extendSettings(Model, key, def)
  }
  // Load methods
  require(filePath + '.js')(Model)
}

/**
 * Extend properties
 *
 * @param {Object} model Model instance
 * @param {Object} properties Updated definition of properties
 */
const extendProperties = (model, properties) => {
  // Get keys
  let propertyNames = Object.keys(properties)
  // Iterate and define properties
  let len = propertyNames.length
  for (let i = 0; i < len; i++) {
    let name = propertyNames[i]
    model.defineProperty(name, properties[name])
  }
}

/**
 * Extend mixins
 *
 * @param {Object} model Loopback Model instance
 * @param {Object} mixins Extended mixins definition
 */
const extendMixins = (model, mixins) => {
  // Get keys
  let propertyNames = Object.keys(mixins)
  // Iterate and define properties
  let len = propertyNames.length
  for (let i = 0; i < len; i++) {
    let name = propertyNames[i]
    model.mixin(name, mixins[name])
  }
}

/**
 * Extend other settings
 *
 * @param {Object} model Loopback Model instance
 * @param {string} name Settings name
 * @param {Object} settings Extended settings
 */
const extendSettings = (model, name, settings) => {
  // Get settings
  let currentSettings = model.definition.settings[name]
  // Init temp
  let updatedSettings
  // If there is no current settings, set settings
  if (!currentSettings) {
    updatedSettings = settings
  } else {
    // Init updated settings
    let updatedSettings
    // If current settings is and array, merge array
    if (Array.isArray(currentSettings)) {
      // If settings is not an array, convert to array
      if (!Array.isArray(settings))
        settings = [settings]
      // Merge settings array
      updatedSettings = currentSettings.concat(settings)
    } else if (typeof currentSettings === 'object' && typeof settings === 'object') {
      // Else if, current settings and settings is an object, update settings delta
      updatedSettings = currentSettings
      let keys = Object.keys(currentSettings)
      let len = keys.length
      for (let i = 0; i < len; i++) {
        let key = keys[i]
        updatedSettings[key] = settings[key]
      }
    } else if (typeof currentSettings === 'object' && Array.isArray(settings)) {
      // Else if, current settings is an object and settings is an array, unshift current settings
      updatedSettings = settings
      updatedSettings.unshift(currentSettings)
    }
  }
  // Set new settings
  model.definition.settings[name] = updatedSettings
}

/**
 * Extend relations attribute
 *
 * @param {Object} model Model
 * @param {Object} relations Relations definition
 */
const extendRelations = (model, relations) => {
  // Get keys
  let names = Object.keys(relations)
  // Apply relations
  let len = names.length
  for (let i = 0; i < len; i++) {
    // Get name
    let name = names[i]
    // Get relation options
    let options = relations[name]
    // Get related model
    let relatedModelName = options.model
    let relatedModel = model.app.models[relatedModelName]
    // Get relation type
    let relationType = options.type
    // remove type and model name from options
    delete options.model
    delete options.type
    // add name
    options.as = name
    // Set relation
    model[relationType](relatedModel, options)
    debug('Applying relation to model %s, type: %s, options: %O', relatedModelName, relationType, options)
  }
}

