interface CategoryRule {
  patterns: RegExp[];
  category: string;
}

export class CategoryService {
  private rules: CategoryRule[] = [
    {
      patterns: [/swiggy/i, /zomato/i, /domino/i, /mcdonald/i, /kfc/i, /pizza\s*hut/i, /starbucks/i, /dunkin/i, /subway/i, /burger\s*king/i, /food/i, /restaurant/i, /cafe/i, /dhaba/i, /eat/i, /dining/i, /biryani/i, /tiffin/i, /mess/i, /canteen/i, /pizza/i, /burger/i, /sandwich/i, /chaat/i, /sweets/i, /bakery/i, /ice\s*cream/i, /zepto.*(?:food|grocery)/i, /blinkit.*(?:food)/i, /instamart/i, /bigbasket/i],
      category: 'Food',
    },
    {
      patterns: [/amazon/i, /flipkart/i, /myntra/i, /nykaa/i, /ajio/i, /tatacliq/i, /croma/i, /vijay\s*sales/i, /reliance\s*digital/i, /shopping/i, /mall/i, /retail/i, /lifestyle/i, /shoppers\s*stop/i, /westside/i, /zara/i, /hm\b/i, /h\s*&\s*m/i, /pantaloons/i, /max\s*fashion/i, /clothing/i, /apparel/i, /footwear/i, /shoe/i, /jewellery/i, /jewelry/i, /watch/i, /electronics/i, /gadget/i, /mobile/i, /laptop/i, /amazon\s*pay/i, /amzn/i],
      category: 'Shopping',
    },
    {
      patterns: [/petrol/i, /diesel/i, /fuel/i, /bpcl/i, /iocl/i, /hpcl/i, /indian\s*oil/i, /bharat\s*petroleum/i, /hindustan\s*petroleum/i, /shell/i, /gas\s*station/i, /filling\s*station/i, /petroleum/i, /gasoline/i, /cng/i, /lpg/i],
      category: 'Fuel',
    },
    {
      patterns: [/bill/i, /recharge/i, /electricity/i, /power\s*bill/i, /water\s*bill/i, /gas\s*bill/i, /broadband/i, /internet/i, /telephone/i, /landline/i, /dth/i, /cable\s*tv/i, /jio\s*fiber/i, /airtel\s*(?:broadband|internet)/i, /tata\s*power/i, /adani\s*power/i, /bsnl/i, /mtnl/i, /maintenance/i, /society\s*fee/i, /property\s*tax/i, /insurance\s*premium/i, /lic\b/i, /health\s*insurance/i, /car\s*insurance/i, /bike\s*insurance/i],
      category: 'Bills',
    },
    {
      patterns: [/netflix/i, /spotify/i, /hotstar/i, /prime\s*video/i, /youtube/i, /sony\s*liv/i, /zee5/i, /amazon\s*prime/i, /disney/i, /hbo/i, /entertainment/i, /movie/i, /cinema/i, /theatre/i, /theater/i, /bookmyshow/i, /concert/i, /game/i, /gaming/i, /playstation/i, /xbox/i, /steam/i, /pubg/i, /music/i, /app\s*store/i, /play\s*store/i, /in-app/i, /subscription.*(?:entertainment|ott)/i],
      category: 'Entertainment',
    },
    {
      patterns: [/travel/i, /flight/i, /airline/i, /air\s*india/i, /indigo/i, /spicejet/i, /goair/i, /vistara/i, /railway/i, /irctc/i, /train/i, /metro/i, /bus\s*ticket/i, /cab/i, /taxi/i, /uber/i, /ola\b(?!\s*money)/i, /makemytrip/i, /goibibo/i, /oyo/i, /hotel/i, /resort/i, /booking\.com/i, /trivago/i, /agoda/i, /holiday/i, /tour/i, /trip/i, /visa/i, /passport/i, /luggage/i],
      category: 'Travel',
    },
    {
      patterns: [/hospital/i, /clinic/i, /doctor/i, /dentist/i, /pharmacy/i, /medical/i, /medicine/i, /healthcare/i, /diagnostic/i, /lab/i, /pathology/i, /eye\s*check/i, /optical/i, /ayurveda/i, /physio/i, /therapy/i, /wellness/i, /fitness/i, /gym/i, /yoga/i, /health\s*check/i, /vaccine/i, /immunization/i, /apollo/i, /fortis/i, /max\s*healthcare/i, /medanta/i, /practo/i, /1mg/i, /netmeds/i, /pharmeasy/i],
      category: 'Healthcare',
    },
    {
      patterns: [/salary/i, /payroll/i, /wages/i, /stipend/i, /honorarium/i, /consultation\s*fee/i, /professional\s*fee/i, /income/i, /dividend/i, /interest\s*income/i, /refund/i, /reimbursement/i, /bonus/i, /incentive/i, /commission/i],
      category: 'Salary',
    },
    {
      patterns: [/transfer/i, /neft/i, /rtgs/i, /imps/i, /upi\s*(?:to|from)/i, /fund\s*transfer/i, /account\s*transfer/i, /savings\s*transfer/i, /self\s*transfer/i, /to\s*self/i, /own\s*account/i, /internal\s*transfer/i, /online\s*transfer/i],
      category: 'Transfer',
    },
    {
      patterns: [/investment/i, /mutual\s*fund/i, /mf\b/i, /stock/i, /share/i, /equity/i, /demat/i, /trading/i, /brokerage/i, /zerodha/i, /groww/i, /upstox/i, /angel\s*one/i, /icici\s*direct/i, /hdfc\s*securities/i, /sip/i, /nps/i, /ppf/i, /epf/i, /provident\s*fund/i, /fixed\s*deposit/i, /fd\b/i, /rd\b/i, /recurring\s*deposit/i, /bond/i, /treasury/i, /etf/i, /index\s*fund/i, /liquid\s*fund/i, /debt\s*fund/i],
      category: 'Investment',
    },
    {
      patterns: [/atm/i, /withdrawal/i, /cash\s*withdrawal/i, /cash\s*at\s*pos/i, /pos\s*withdrawal/i, /cash\s*advance/i],
      category: 'ATM',
    },
  ];

  detect(merchant: string, description: string): string {
    const text = `${merchant} ${description}`;
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) return rule.category;
      }
    }
    return 'Others';
  }
}
