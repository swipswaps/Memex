import { createAction } from 'redux-act'

import { deleteMetaAndPage } from 'src/page-storage/deletion'
import * as constants from './constants'
import * as selectors from './selectors'

// Will contain the runtime port which will allow bi-directional communication to the background script
let port

// == Simple commands to change the state in reducers ==

export const setLoading = createAction('overview/setLoading')
export const nextPage = createAction('overview/nextPage')
export const resetPage = createAction('overview/resetPage')
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const setQuery = createAction('overview/setQuery')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideResultItem = createAction('overview/hideResultItem')
export const showDeleteConfirm = createAction('overview/showDeleteConfirm')
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')

const getCmdMessageHandler = dispatch => ({ cmd, ...payload }) => {
    switch (cmd) {
        case constants.CMDS.RESULTS:
            dispatch(updateSearchResult(payload))
            break
        case constants.CMDS.ERROR:
            dispatch(handleErrors(payload))
            break
        default:
            console.error(`Background script sent unknown command '${cmd}' with payload:\n${payload}`)
    }
}

/**
 * Init a connection to the index running in the background script, allowing
 * redux actions to be dispatched whenever a command is received from the background script.
 * Also perform an initial search to populate the view (empty query = get all docs)
 */
export const init = () => dispatch => {
    port = browser.runtime.connect({ name: constants.SEARCH_CONN_NAME })
    port.onMessage.addListener(getCmdMessageHandler(dispatch))
    dispatch(search({ overwrite: true }))
}

/**
 * Perform a search using the current query params as defined in state. Pagination
 * state will also be used to perform relevant pagination logic.
 * @param {boolean} [overwrite=false] Denotes whether to overwrite existing results or just append.
 */
export const search = ({ overwrite } = { overwrite: false }) => async (dispatch, getState) => {
    // Grab needed derived state for search
    const state = getState()
    const currentQueryParams = selectors.currentQueryParams(state)
    const isLoading = selectors.isLoading(state)
    const skip = selectors.resultsSkip(state)

    // If loading already, don't start another search
    if (isLoading) return

    dispatch(setLoading(true))

    const searchParams = {
        ...currentQueryParams,
        limit: constants.PAGE_SIZE,
        skip,
    }

    // Tell background script to search
    port.postMessage({ cmd: constants.CMDS.SEARCH, searchParams, overwrite })
}

const updateSearchResult = ({ searchResult, overwrite } = { overwrite: false, searchResult: [] }) => dispatch => {
    console.log(searchResult)
    let searchAction

    if (overwrite) {
        dispatch(resetPage())
        searchAction = setSearchResult
    } else {
        searchAction = appendSearchResult
    }

    dispatch(searchAction(searchResult))
    dispatch(setLoading(false))
}

// TODO stateful error handling
const handleErrors = ({ query, error }) => dispatch => {
    console.error(`Search for '${query}' errored: ${error}`)
    dispatch(setLoading(false))
}

/**
 * Increments the page state before scheduling another search.
 */
export const getMoreResults = () => async dispatch => {
    dispatch(nextPage())
    dispatch(search())
}

export const deleteMeta = (metaDoc, deleteAssoc = false) => async (dispatch, getState) => {
    // Hide the result item + confirm modal directly (optimistically)
    dispatch(hideResultItem(metaDoc))
    dispatch(hideDeleteConfirm())
    // Remove it from the database.
    await deleteMetaAndPage({ metaDoc, deleteAssoc })

    // Refresh search view after deleting all assoc docs
    if (deleteAssoc) {
        dispatch(search({ overwrite: true }))
    }
}
