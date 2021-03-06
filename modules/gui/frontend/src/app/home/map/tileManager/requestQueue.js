import {getLogger} from 'log'
import {requestTag} from 'tag'
import _ from 'lodash'

const log = getLogger('tileManager')

export const getRequestQueue = () => {
    const pendingRequests = []

    const getCount = () => {
        return pendingRequests.length
    }
    
    const isEmpty = () => {
        return getCount() === 0
    }
    
    const enqueue = ({tileProviderId, requestId, request, response$, cancel$}) => {
        pendingRequests.push({tileProviderId, requestId, request, response$, cancel$})
        log.debug(`Enqueued ${requestTag({tileProviderId, requestId})}, pending: ${getCount()}`)
    }

    const dequeueNormal = () => {
        const pendingRequest = pendingRequests.shift()
        log.debug(`Dequeued (normal) ${requestTag(pendingRequest)}, pending: ${getCount()}`)
        return pendingRequest
    }

    const dequeuePriority = requestId => {
        if (requestId) {
            const index = _.findIndex(pendingRequests, pendingRequest => pendingRequest.requestId === requestId)
            if (index !== -1) {
                const [pendingRequest] = pendingRequests.splice(index, 1)
                log.debug(`Dequeued (priority) ${requestTag(pendingRequest)}, pending: ${getCount()}`)
                return pendingRequest
            }
        }
        console.warn(`Could not dequeue ${requestTag({requestId})}`)
        return null
    }

    const remove = requestId => {
        if (requestId) {
            const index = _.findIndex(pendingRequests, pendingRequest => pendingRequest.requestId === requestId)
            if (index !== -1) {
                const [pendingRequest] = pendingRequests.splice(index, 1)
                log.debug(`Removed ${requestTag(pendingRequest)}, pending: ${getCount()}`)
            }
        }
    }

    const scan = callback =>
        pendingRequests.forEach(callback)

    return {isEmpty, enqueue, dequeueNormal, dequeuePriority, remove, scan}
}
