const {stream} = require('sepal/httpServer')

const sceneAreas$ = require('root/jobs/ee/image/sceneAreas')
const preview$ = require('root/jobs/ee/image/preview')
const loadCCDCSegments$ = require('root/jobs/ee/ccdc/loadSegments')
const loadTimeSeriesbservations$ = require('root/jobs/ee/timeSeries/loadObservations')
const nextReferenceDataPoints$ = require('root/jobs/ee/classification/nextReferenceDataPoints')
const imageBands$ = require('root/jobs/ee/image/bands')
const imageMetadata$ = require('root/jobs/ee/image/metadata')
const imageGeometry$ = require('root/jobs/ee/image/geometry')
const sampleImage$ = require('root/jobs/ee/image/sample')
const tableColumns$ = require('root/jobs/ee/table/columns')
const tableColumnValues$ = require('root/jobs/ee/table/columnValues')
const tableRows$ = require('root/jobs/ee/table/rows')
const tableQuery$ = require('root/jobs/ee/table/query')
const tableMap$ = require('root/jobs/ee/table/map')
const check$ = require('root/jobs/ee/check')
const testHttp$ = require('root/jobs/test/http')
const testHttpDirect$ = require('root/jobs/test/http/test')
const testWs$ = require('root/jobs/test/ws')

module.exports = router =>
    router
        .post('/sceneareas', stream(ctx => sceneAreas$(ctx)))
        .post('/preview', stream(ctx => preview$(ctx)))
        .post('/bands', stream(ctx => imageBands$(ctx)))
        .get('/image/sample', stream(ctx => sampleImage$(ctx)))
        .post('/imageMetadata', stream(ctx => imageMetadata$(ctx)))
        .post('/recipe/geometry', stream(ctx => imageGeometry$(ctx)))
        .post('/ccdc/loadSegments', stream(ctx => loadCCDCSegments$(ctx)))
        .post('/timeSeries/loadObservations', stream(ctx => loadTimeSeriesbservations$(ctx)))
        .post('/nextReferenceDataPoints', stream(ctx => nextReferenceDataPoints$(ctx)))
        .get('/table/rows', stream(ctx => tableRows$(ctx)))
        .get('/table/columns', stream(ctx => tableColumns$(ctx)))
        .get('/table/columnValues', stream(ctx => tableColumnValues$(ctx)))
        .post('/table/query', stream(ctx => tableQuery$(ctx)))
        .get('/table/map', stream(ctx => tableMap$(ctx)))
        .get('/test/worker/:min/:max/:errorProbability', stream(ctx => testHttp$(ctx)))
        .get('/test/direct/:min/:max/:errorProbability', stream(
            ({params: {min, max, errorProbability}}) => testHttpDirect$(parseInt(min), parseInt(max), parseInt(errorProbability))
        ))
        .get('/ws/:name', stream(ctx => testWs$(ctx)))
        .get('/healthcheck', stream(ctx => check$(ctx)))
