import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import BidBox from "../../components/BidBox";
import Link from "next/link";
import SellBox from "../../components/SellBox";
import Slider from "../../components/Slider";
import CombinedOrdersBox from "../../components/CombinedOrdersBox";
import ClaimBox from "../../components/ClaimBox";
import { Box, Select } from "@chakra-ui/react";
import { AppProvider } from "../../components/AppContext";

export default function Home() {
  const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] =
    useState(false);
  const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);

  const [selected, setSelected] = useState(1);

  const closeAll = () => {
    setIsNetworkSwitchHighlighted(false);
    setIsConnectHighlighted(false);
  };
  return (
    <div className="flex flex-col space-y-10">
      <Head>
        <title>COMMUNITAS Energy Market</title>
        <link rel="icon" href="/communitas.ico" />
      </Head>
      <header>
        <div
          className={styles.backdrop}
          style={{
            opacity: isConnectHighlighted || isNetworkSwitchHighlighted ? 1 : 0,
          }}
        />
        <div className={styles.header}>
          <div className={styles.logo}>
            <Link href="/">
              <Image
                src="/communitas.png"
                alt="COMMUNITAS logo"
                height="32"
                width="203"
              />
            </Link>
          </div>
          <Box width="200px" marginRight="16px">
            <Select
              placeholder="Select option"
              variant="outline"
              size="md"
              borderColor="gray.400"
              backgroundColor={"white"}
              _hover={{ borderColor: "gray.600" }}
              _focus={{
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px blue.500",
              }}
              onChange={(e) => console.log(e.target.value)}
            >
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </Select>
          </Box>
          <div className={styles.buttons}>
            <div
              onClick={closeAll}
              className={`${styles.highlight} ${
                isNetworkSwitchHighlighted ? styles.highlightSelected : ``
              }`}
            >
              <w3m-network-button />
            </div>
            <div
              onClick={closeAll}
              className={`${styles.highlight} ${
                isConnectHighlighted ? styles.highlightSelected : ``
              }`}
            >
              <w3m-button />
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AppProvider>
          <Slider selected={selected} setSelected={setSelected} />
          {selected == 1 ? <BidBox /> : ""}
          {selected == 2 ? <SellBox /> : ""}
          {selected == 3 ? <CombinedOrdersBox /> : ""}
          {selected == 4 ? <ClaimBox /> : ""}
        </AppProvider>
      </div>
    </div>
  );
}
