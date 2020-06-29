const {BehaviorSubject, defer, timer, of} = require('rx')
const {filter, switchMap, tap, first} = require('rx/operators')
const fs = require('fs')
const path = require('path')
const {mkdir$} = require('root/rxjs/fileSystem')
const log = require('sepal/log').getLogger('context')
const _ = require('lodash')
const config = require('./config')

const CREDENTIALS_FILE = 'credentials'

const context$ = new BehaviorSubject()

const setCredentials = userCredentials => {
    const serviceAccountCredentials = config && config.serviceAccountCredentials
    if (userCredentials) {
        const tokenExpiration = userCredentials['access_token_expiry_date'] || 0
        const timeLeftMs = tokenExpiration - Date.now()
        const currentCredentials = context$.getValue()
        if (timeLeftMs > 0 && (!currentCredentials || !_.isEqual(userCredentials, currentCredentials.userCredentials))) {
            log.debug(`User credentials updated, expiring in ${Math.round(timeLeftMs / 1000)} seconds`)
            context$.next({config, userCredentials, serviceAccountCredentials})
        } else if (timeLeftMs <= 0) {
            log.warn('Received expired user credentials, ignored')
        } else {
            log.trace('User credentials unchanged')
        }
    } else {
        context$.next({config, serviceAccountCredentials})
    }
}

const credentialsDir = () =>
    `${config.homeDir}/.config/earthengine`

const credentialsPath = () =>
    path.join(credentialsDir(), CREDENTIALS_FILE)

const monitorUserCredentials = () => {
    const userCredentialsPath = credentialsPath()
    log.debug(`Monitoring user credentials in ${userCredentialsPath}`)
    mkdir$(credentialsDir(), {recursive: true}).pipe(
        switchMap(() =>
            timer(0, 1000 * 60).pipe(
                tap(() => loadUserCredentials())
            )
        )
    ).subscribe()
}
    
const loadUserCredentials = () => {
    const userCredentialsPath = credentialsPath()
    fs.promises.readFile(userCredentialsPath, {encoding: 'utf8'})
        .then(rawUserCredentials => {
            const userCredentials = JSON.parse(rawUserCredentials)
            setCredentials(userCredentials)
        })
        .catch(() => {
            log.trace('Missing of invalid user credentials file')
            setCredentials()
        })
}

const getConfig = () =>
    config

const getContext$ = () =>
    defer(() => {
        const context = context$.getValue()
        return context
            ? of(context)
            : context$.pipe(
                filter(context => context),
                first()
            )
    })

monitorUserCredentials()

module.exports = {getConfig, getContext$}
