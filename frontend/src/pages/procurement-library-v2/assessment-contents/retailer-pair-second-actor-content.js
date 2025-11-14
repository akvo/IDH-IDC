// * const name reflec the actors pair (e.g. retailer actor > farmer actor become retailer_farmer)

const retailer_farmer = {
  sectionA: { title: "Retailer" },
  sectionB: { title: "Farmer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Retailers, with other supply chain actors and donors, can pre- competitively co-operate to support farmers/smallholders to implement practices that help mitigate sustainability risks and improve security of supply",
          "Farmers/smallholders can benefit financially from direct relationships with retailers, allowing them to access higher incomes and improve agricultural practices to secure longer- term productivity of their land",
          "Shortening the supply chain, be developing direct farmer relationships, can also lower costs for retailers simply by cutting out other actors who add more cost than value",
        ],
      },
    ],
  },
  sectionD: {
    list: [
      {
        text: "Understanding other actors",
      },
      {
        list: [
          {
            title: "Challenges",
            list: [
              "Farmers/smallholders often have the least power in a value chain, meaning their income and ability to operate is vulnerable to all cost pressures downstream",
              "Smallholder farmers often lack the capital and long-term financial stability to implement actions that could results in lower costs and reduced crop volatility",
              "Smallholder farmers may lack knowledge of technologies and processes that could positively impact their crops",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Farmers/Smallholders have a great capacity to grow their capabilities and knowledge from peers and downstream actors.",
            ],
          },
        ],
      },
    ],
  },
};

const retailer_primary = {
  sectionA: { title: "Retailer" },
  sectionB: { title: "Primary/Secondary Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Collaboration with primary/ secondary processors can provide retailers with a conduit for implementing actions to mitigate sustainability risks early in the supply chain, and help a retailer secure more consistent supplies and lower long-term costs",
          "This direct collaboration can give primary/ secondary processors greater opportunity to negotiate better prices, reflective of the work they do to protect retailer risks, and access financing needed to launch initiatives with longer- term returns",
          "Shortening the supply chain can also lower costs for retailers simply by cutting out other actors who add more cost than value",
        ],
      },
    ],
  },
  sectionD: {
    list: [
      {
        text: "Understanding other actors",
      },
      {
        list: [
          {
            title: "Challenges",
            list: [
              "Primary/ secondary processors can be at the mercy of market prices from traders, with little opportunity to engage and negotiate",
              "Primary/ secondary processors can be especially vulnerable to local conditions e.g. climate, economic, politics due to their size and limited operating area",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Primary/ secondary processors often have direct, or close to, relationships with farmers, allowing collaboration on implementing actions",
              "Primary/ secondary processors can be the first point in a value chain that multiple farmer outputs are brought together, creating the possibility to leverage economies of scale across individual farms",
            ],
          },
        ],
      },
    ],
  },
};

const retailer_trader = {
  sectionA: { title: "Retailer" },
  sectionB: { title: "Primary/Secondary Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Combining retailer knowledge of higher-risk sourcing regions for certain commodities with a trader’s capabilities to diversify sourcing regions can help mitigate risks for both parties",
          "Traders could be the conduit for sourcing data needed by retailers to allow identification of risk and implementation of necessary actions, e.g. to comply with regulation",
          "Implementing longer-term relationships founded in more sustainable approaches to commodity procurement could provide the financial stability needed in the short term to implement practices that reduce sustainability risks, volatility and longer-term costs for both parties",
        ],
      },
    ],
  },
  sectionD: {
    list: [
      {
        text: "Understanding other actors",
      },
      {
        list: [
          {
            title: "Challenges",
            list: [
              "Traders often operate on very fine margins, relying on large volumes to operate profitably",
              "Traders can have a commodity-driven view of the value chain, which can inhibit their ability to lean into deeper relationships",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Traders can connect buyers directly to commodities from around the world",
              "Traders can have upstream and downstream visibility allowing the sharing of data between actors",
              "Traders have the opportunity to convene downstream actors/customers on pre-competitive collaboration to support implementation of sustainability interventions",
            ],
          },
        ],
      },
    ],
  },
};

const retailer_manufacturer = {
  sectionA: { title: "Retailer" },
  sectionB: { title: "Manufacturer/Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "For retail categories facing significant consumer cost pressure, implementing sustainable procurement practices upstream will identify the right interventions to optimise costs.",
          "Where there are shared sustainability risks and opportunities in the supply chain, there may be cost efficiencies for both parties in figuring out a solution together",
          "Maintaining and growing business with own-brand manufacturers that are effectively managing sustainability risks in the supply chain can be more efficient for the retailer and more financial stability for the manufacturer",
          "Brand manufacturers are more exposed to the reputational risks associated with their brand; a retailer should be able to trust a brand to manage these risks to protect their own brand equity",
        ],
      },
    ],
  },
  sectionD: {
    list: [
      {
        text: "Understanding other actors",
      },
      {
        list: [
          {
            title: "Challenges",
            list: [
              "Brand manufacturers are more exposed to reputational risks amongst consumers",
              "Manufacturers/ processors often don’t have full visibility of their supply chain and have to rely on trust in other actors",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Manufacturers/ processors usually have direct relationships with multiple other actors in the value chain. They can more easily identify opportunities for collaboration.",
              "Brand manufacturers have greater influence over consumer perception of value for their products, and therefore the ability to link this to more than simply the quality and cost of the product",
            ],
          },
        ],
      },
    ],
  },
};

export const RETAILER_PAIR = {
  retailer_farmer,
  retailer_primary,
  retailer_trader,
  retailer_manufacturer,
};
