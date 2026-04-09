"use client";

import * as React from "react";
import { useCallback } from "react";
import BridgeBox from "./BridgeBox";
import BridgeHistory from "./BridgeHistory";

type TabItem = {
    id: string;
    label: string;
    component: React.FunctionComponentElement<any>;
};

interface NavigationTabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
}

/**
 * NavigationTabs component provides a stylish navigation bar with tab-like functionality
 */
const NavigationTabs: React.FC<NavigationTabsProps> = ({
    tabs,
    activeTabId,
    onTabChange,
}) => {
    const handleTabClick = useCallback(
        (tabId: string) => {
            onTabChange(tabId);
        },
        [onTabChange]
    );

    return (
        <nav className="text-base text-center text-white whitespace-nowrap w-full max-w-[330px]">
            <ul
                className="inline-flex justify-center bg-white/10 p-1 rounded-xl gap-1 sm:gap-2 border border-white/10"
                role="tablist"
            >
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;
                    return (
                        <li key={tab.id} role="presentation">
                            <button
                                onClick={() => handleTabClick(tab.id)}
                                className={`
                                    min-h-[44px] px-5 sm:px-6 py-2 rounded-lg
                                    text-sm sm:text-base font-medium
                                    transition-all duration-200 ease-in-out
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
                                    ${isActive
                                        ? "bg-black/80 shadow-md text-white"
                                        : "bg-transparent text-gray-300 hover:bg-white/15 hover:text-white"
                                    }
                                `}
                                aria-selected={isActive}
                                role="tab"
                                tabIndex={isActive ? 0 : -1}
                            >
                                {tab.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export const defaultTabs: TabItem[] = [
    { id: "bridge", label: "Bridge", component: <BridgeBox /> },
    { id: "history", label: "History", component: <BridgeHistory /> },
    /*{id: "nft", label: "NFT", }*/
];

export default React.memo(NavigationTabs);
