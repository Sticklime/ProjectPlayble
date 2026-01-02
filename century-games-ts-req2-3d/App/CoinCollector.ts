import ThreeText from "ThreeText";

export class CoinCollector {
    private coinCount = 0;
    private readonly root: ThreeText;
    private readonly coinText: ThreeText;

    constructor(root: ThreeText) {
        this.root = root;

        this.coinText = new ThreeText("", {
            styles: {
                fontSize: 54,
                fontFamily: "NataSans",
                color: 0x000000,
                padding: 128
            }
        });

        if (typeof this.root.add === "function") {
            this.root.add(this.coinText);
            this.coinText.position.y += 9;
            this.coinText.position.x += 30;
        }

        this.updateCoinText();
    }

    public collectCoin(count: number): void {
        this.coinCount += count;
        this.updateCoinText();
    }

    public removeCoin(count: number): void {
        this.coinCount -= count;
        this.updateCoinText();
    }

    public getCoin(): number {
        return this.coinCount;
    }

    public updateCoinText(): void {
      this.coinText.text = String(this.coinCount);
    }
}
