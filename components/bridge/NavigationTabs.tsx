"use client";

import * as React from "react";
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


    const handleTabClick = (tabId: string) => {
        onTabChange(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    return (
        <nav className="text-base text-center text-white whitespace-nowrap max-w-[330px]">
            <ul className="inline-flex justify-center bg-white bg-opacity-10 p-1 rounded-xl gap-2 border border-white border-opacity-10">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`px-6 py-1 rounded-lg transition-colors duration-200 ease-in-out ${
                            activeTabId === tab.id
                                ? "bg-black bg-opacity-80 shadow-md"
                                : "bg-transparent hover:bg-white hover:bg-opacity-20"
                        }`}
                        aria-selected={activeTabId === tab.id}
                        role="tab"
                    >
                        {tab.label}
                    </button>
                ))}
            </ul>
        </nav>

    );
};

export const defaultTabs: TabItem[] = [
    {id: "bridge", label: "Bridge", component: <BridgeBox/>},
    {id: "history", label: "History", component: <BridgeHistory/>},
    /*{id: "nft", label: "NFT", }*/
];

export default NavigationTabs;
