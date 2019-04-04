import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'

import menuStyles from './menu-styles'
import localStyles from './Sidebar.css'
import cx from 'classnames'
import CollectionsButton from './CollectionsButtonContainer'

class Sidebar extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        isSidebarLocked: PropTypes.bool.isRequired,
        captureStateChange: PropTypes.func.isRequired,
        onMouseLeave: PropTypes.func.isRequired,
        onMouseEnter: PropTypes.func.isRequired,
        closeSidebar: PropTypes.func.isRequired,
        setSidebarLocked: PropTypes.func.isRequired,
    }

    closeLockedSidebar = () => {
        this.props.setSidebarLocked(false)
        this.props.closeSidebar()
    }

    render() {
        return (
            <div
                onMouseLeave={this.props.onMouseLeave}
                onMouseEnter={this.props.onMouseEnter}
            >
                <Menu
                    styles={menuStyles(
                        this.props.isSidebarLocked,
                        this.props.isSidebarOpen || this.props.isSidebarLocked,
                    )}
                    noOverlay
                    customBurgerIcon={null}
                    customCrossIcon={<img src="/img/cross_grey.svg" />}
                    isOpen
                    onStateChange={this.props.captureStateChange}
                >
                    <div className={localStyles.container}>
                        <div className={localStyles.collectionsBtn}>
                            <CollectionsButton />
                        </div>
                        <button
                            className={cx(localStyles.arrowButton, {
                                [localStyles.arrow]: this.props.isSidebarLocked,
                                [localStyles.arrowReverse]: !this.props
                                    .isSidebarLocked,
                            })}
                            onClick={() =>
                                !this.props.isSidebarLocked
                                    ? this.props.setSidebarLocked(true)
                                    : this.closeLockedSidebar()
                            }
                        />
                        {(this.props.isSidebarOpen ||
                            this.props.isSidebarLocked) &&
                            this.props.children}
                    </div>
                </Menu>
            </div>
        )
    }
}

export default Sidebar
