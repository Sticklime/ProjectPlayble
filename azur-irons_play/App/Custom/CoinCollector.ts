import ThreeText from "ThreeText";

export class CoinCollector {
    private coinCount: number = 0;
    private root: ThreeText;
    private coinText: ThreeText;

    constructor(root: ThreeText) {
        this.root = root;

        this.coinText = new ThreeText("000000", {
            styles: {
                text: "   0    ",
                fontSize: 54,
                fontFamily: "Montserrat-Bold",
                color: "#ffffff",
            }
        });

        if (typeof this.root.add === "function") {
            this.root.add(this.coinText);
        }

        this.updateCoinText();
    }

    public collectCoin(): void {
        this.coinCount++;
        this.updateCoinText();
    }

    private updateCoinText(): void {
        this.coinText.text = `   ${this.coinCount}    `;
    }
}
