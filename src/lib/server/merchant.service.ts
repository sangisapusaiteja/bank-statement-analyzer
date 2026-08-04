interface MerchantRule {
  patterns: RegExp[];
  canonical: string;
}

export class MerchantService {
  private rules: MerchantRule[] = [
    { patterns: [/swiggy/i, /raz\*swiggy/i, /upi\/swiggy/i, /swiggy\s*instamart/i], canonical: 'Swiggy' },
    { patterns: [/amazon/i, /amzn/i, /amazon\s*pay/i, /amazon\s*seller/i, /amazon\s*services/i], canonical: 'Amazon' },
    { patterns: [/paytm/i, /ptybl/i], canonical: 'Paytm' },
    { patterns: [/zomato/i, /zomato\s*online/i], canonical: 'Zomato' },
    { patterns: [/uber/i, /uber\s*india/i], canonical: 'Uber' },
    { patterns: [/ola/i, /ola\s*money/i], canonical: 'Ola' },
    { patterns: [/flipkart/i, /flipkart\s*pay/i], canonical: 'Flipkart' },
    { patterns: [/myntra/i], canonical: 'Myntra' },
    { patterns: [/netflix/i, /netflix\.com/i], canonical: 'Netflix' },
    { patterns: [/spotify/i], canonical: 'Spotify' },
    { patterns: [/hotstar/i, /disney\+?\s*hotstar/i], canonical: 'Hotstar' },
    { patterns: [/prime\s*video/i, /amazon\s*prime/i], canonical: 'Amazon Prime' },
    { patterns: [/google\s*pay/i, /gpay/i, /google/i], canonical: 'Google Pay' },
    { patterns: [/phonepe/i, /phone\s*pe/i], canonical: 'PhonePe' },
    { patterns: [/bharat\s*petroleum/i, /bharat\s*petroleum\s*corp/i, /bpcl/i], canonical: 'BPCL' },
    { patterns: [/indian\s*oil/i, /iocl/i], canonical: 'Indian Oil' },
    { patterns: [/hp\s*petrol/i, /hpcl/i, /hindustan\s*petroleum/i], canonical: 'HPCL' },
    { patterns: [/reliance\s*jio/i, /jio\s*recharge/i, /jio\s*fiber/i], canonical: 'Jio' },
    { patterns: [/airtel/i, /airtel\s*recharge/i], canonical: 'Airtel' },
    { patterns: [/vi\s*recharge/i, /vodafone/i, /idea/i], canonical: 'Vodafone Idea' },
    { patterns: [/dmart/i, /d\s*mart/i], canonical: 'DMart' },
    { patterns: [/bigbasket/i, /big\s*basket/i], canonical: 'BigBasket' },
    { patterns: [/zepto/i], canonical: 'Zepto' },
    { patterns: [/blinkit/i, /blink\s*it/i, /grofers/i], canonical: 'Blinkit' },
    { patterns: [/dominos/i, /domino/i, /domino\s*pizza/i], canonical: "Domino's" },
    { patterns: [/mcdonald/i, /mcd/i, /maccas/i], canonical: "McDonald's" },
    { patterns: [/kfc/i, /kentucky/i], canonical: 'KFC' },
    { patterns: [/pizza\s*hut/i], canonical: 'Pizza Hut' },
    { patterns: [/starbucks/i, /starbucks\s*coffee/i], canonical: 'Starbucks' },
    { patterns: [/tata\s*power/i, /tata\s*power\s*recharge/i], canonical: 'Tata Power' },
    { patterns: [/adani\s*power/i, /adani\s*electricity/i], canonical: 'Adani Power' },
    { patterns: [/mumbai\s*metro/i, /delhi\s*metro/i, /metro\s*rail/i, /namma\s*metro/i], canonical: 'Metro' },
    { patterns: [/irctc/i, /indian\s*railway/i, /rail/i], canonical: 'IRCTC' },
    { patterns: [/makemytrip/i, /make\s*my\s*trip/i], canonical: 'MakeMyTrip' },
    { patterns: [/goibibo/i], canonical: 'Goibibo' },
    { patterns: [/oyo/i, /oyo\s*rooms/i], canonical: 'OYO' },
    { patterns: [/bookmyshow/i, /book\s*my\s*show/i], canonical: 'BookMyShow' },
    { patterns: [/nykaa/i], canonical: 'Nykaa' },
    { patterns: [/ajio/i], canonical: 'Ajio' },
    { patterns: [/tatacliq/i, /tata\s*cli?q/i], canonical: 'Tata CLiQ' },
    { patterns: [/croma/i], canonical: 'Croma' },
    { patterns: [/vijay\s*sales/i], canonical: 'Vijay Sales' },
    { patterns: [/reliance\s*digital/i, /reliance\s*retail/i], canonical: 'Reliance Digital' },
    { patterns: [/LIC/i, /lic\s*of\s*india/i, /life\s*insurance/i], canonical: 'LIC' },
    { patterns: [/hdfc\s*securities/i, /hdfc\s*mf/i, /hdfc\s*mutual/i], canonical: 'HDFC Securities' },
    { patterns: [/zerodha/i], canonical: 'Zerodha' },
    { patterns: [/groww/i], canonical: 'Groww' },
    { patterns: [/angel\s*broking/i, /angel\s*one/i], canonical: 'Angel One' },
    { patterns: [/upstox/i], canonical: 'Upstox' },
    { patterns: [/icici\s*direct/i, /icici\s*securities/i], canonical: 'ICICI Direct' },
    { patterns: [/burger\s*king/i, /burgerking/i], canonical: 'Burger King' },
    { patterns: [/zudio/i, /trent\s*zudio/i], canonical: 'Zudio' },
    { patterns: [/vishal\s*mega\s*mart/i, /vishal/i], canonical: 'Vishal Mega Mart' },
    { patterns: [/rapido/i], canonical: 'Rapido' },
    { patterns: [/meesho/i], canonical: 'Meesho' },
    { patterns: [/blossom\s*family\s*salon/i, /blossom/i], canonical: 'Blossom Salon' },
    { patterns: [/manikanta\s*super\s*cool/i], canonical: 'Manikanta Super Cool' },
    { patterns: [/ramaiah\s*mess/i], canonical: 'Ramaiah Mess' },
    { patterns: [/innovative\s*retail/i], canonical: 'Innovative Retail' },
    { patterns: [/orbgen\s*technologies/i], canonical: 'Orbgen Technologies' },
    { patterns: [/bhargo\s*innovations/i, /bhargo/i], canonical: 'Bhargo Innovations' },
    { patterns: [/n16\s*food\s*court/i, /n16\s*food/i], canonical: 'N16 Food Court' },
  ];

  normalize(merchant: string): string {
    if (!merchant) return 'Unknown';
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(merchant)) return rule.canonical;
      }
    }
    return this.titleCase(merchant);
  }

  private titleCase(str: string): string {
    return str.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
  }
}
