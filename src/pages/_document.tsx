import { Html, Head, Main, NextScript } from "next/document";
import BidBox from "../../components/BidBox";

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<title>COMMUNITAS Energy Market</title>
				<link rel="icon" href="/communitas.ico"/>
				<meta
					name="google-site-verification"
					content="6Gtzx3veON661xdrUMbM-KbCCO2MrRfVAWDu-tlZy84"
				/>
				<meta name="description"
					  content="WattSwap lets users trade energy in real-time using blockchain. Built for transparency and sustainability. Built by the Communitas project."/>
			</Head>
			<body>
			<Main/>
			<NextScript/>
			</body>
		</Html>
	);
}
