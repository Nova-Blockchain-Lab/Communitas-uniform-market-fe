import Head from "next/head";
import {AppProvider} from "../../components/AppContext";
import {Link} from "@chakra-ui/react";
import BridgeBox from "../../components/bridge/BridgeBox";
import styles from "@/styles/Home.module.css";
import Image from "next/image";
import {useState} from "react";

export default function Bridge() {
    const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] =
        useState(false);
    const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);

    const closeAll = () => {
        setIsNetworkSwitchHighlighted(false);
        setIsConnectHighlighted(false);
    };

    return (
        <AppProvider>
            <Head>
                <title>Nova Cidade Bridge</title>
                <link rel="icon" href="/Logo-NovaCidade.svg"/>
            </Head>
            <header>
                <div
                    className={styles.backdrop}
                    style={{
                        opacity:
                            isConnectHighlighted || isNetworkSwitchHighlighted ? 1 : 0,
                    }}
                />
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <Link href="/">
                            <Image
                                src="/Logo-NovaCidade.svg"
                                alt="Nova Cidade logo"
                                height="32"
                                width="120"
                            />
                        </Link>
                    </div>
                    <div className={styles.buttons}>
                        <div
                            onClick={closeAll}
                            className={`${styles.highlight} ${
                                isNetworkSwitchHighlighted ? styles.highlightSelected : ``
                            }`}
                        >
                            <w3m-network-button/>
                        </div>
                        <div
                            onClick={closeAll}
                            className={`${styles.highlight} ${
                                isConnectHighlighted ? styles.highlightSelected : ``
                            }`}
                        >
                            <w3m-button/>
                        </div>
                    </div>
                </div>
            </header>
            <div
                className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-700 to-green-950">
                <div className="flex flex-col items-center justify-center relative">
                    <div
                        className="absolute top-10 -left-20 w-96 h-96 bg-green-500 rounded-full opacity-20 blur-sm"></div>
                    <div
                        className="absolute bottom-10 -right-10 w-96 h-96 bg-green-500 rounded-full opacity-20 blur-sm"></div>
                    <BridgeBox/>
                </div>
            </div>
        </AppProvider>
    );
}
