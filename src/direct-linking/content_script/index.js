import { bodyLoader } from 'src/util/loader'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    makeHighlightDark,
    renderHighlight,
    scrollToHighlight,
} from 'src/highlighting/ui/highlight-interactions'

export async function init() {
    await bodyLoader()
    setTimeout(() => {
        remoteFunction('followAnnotationRequest')()
    }, 500)
}

export function setupAnchorFallbackOverlay() {}

browser.runtime.onMessage.addListener(request => {
    if (request.type !== 'direct-link') {
        return
    }

    ;(async () => {
        const highlightSuccessful = await renderHighlight(request)
        if (highlightSuccessful) {
            makeHighlightDark(request.annotation)
            scrollToHighlight(request.annotation)
        } else {
            setupAnchorFallbackOverlay()
        }
    })()
})

init()
