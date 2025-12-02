// * const name reflec the actors pair (e.g. manufacturer actor > farmer actor become manufacturer_farmer)

const manufacturer_farmer = {
  sectionA: { title: "Manufacturer/Processor" },
  sectionB: { title: "Farmer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Manufacturers/ processors, with other supply chain actors and donors, can pre-competitively co-operate to support farmers/smallholders to implement practices that help mitigate sustainability risks and improve security of supply",
          "Manufacturers/ processors can contribute the knowledge and early financing needed to enable farmers to implement improved practices and realise longer-term cost benefits",
          "Farmers/smallholders can benefit financially from direct relationships with manufacturers/processors, allowing them to access higher incomes and improve agricultural practices to secure longer-term productivity of their land",
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

const manufacturer_primary = {
  sectionA: { title: "Manufacturer/Processor" },
  sectionB: { title: "Primary/Secondary Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Collaboration with primary/ secondary processors can provide manufacturers with a conduit for implementing actions to mitigate sustainability risk, improve supply security, and lower long-term costs",
          "This direct collaboration can give primary/ secondary processors greater opportunity to negotiate better prices, reflective of the work they do to protect retailer risks, and access financing needed to launch initiatives with longer- term returns",
          "Primary/secondary processor’s own knowledge and priorities may complement a manufacturer’s own, offering opportunities for deeper collaboration with both parties contributing knowledge and resource",
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

const manufacturer_trader = {
  sectionA: { title: "Manufacturer/Processor" },
  sectionB: { title: "Trader" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Combining manufacturer knowledge of higher-risk sourcing regions for certain commodities with a trader’s capabilities to diversify sourcing regions can help mitigate risks for both parties",
          "Upfront investment from a manufacturer may give the trader the financial stability needed to engage more deeply with upstream suppliers on certain elements of importance to the manufacturer e.g. improving traceability and due diligence in the upstream",
          "Traders could be the conduit for sourcing data needed by manufacturer e.g. to comply with regulation",
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

const manufacturer_retailer = {
  sectionA: { title: "Manufacturer/Processor" },
  sectionB: { title: "Retailer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "A manufacturer that understands the risks common also to a retailer can help mitigate these risks in the supply chain, resulting in reduced risk for both parties Using sustainable procurement to reduce a manufacturer’s own costs, can then help a retailer manage their own cost pressures",
          "Brand manufacturers that understand and address the retailer’s sustainability priorities can differentiate themselves amongst other brands",
          "Retailer own-brand co-manufacturers that can understand and address the retailer’s sustainability priorities, can enhance their ability to grow business with the retailer",
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
              "Retailers have thousands of SKUs and have to move very fast",
              "Retailers are highly vulnerable to consumer cost pressures, expectations and preferences",
              "Retailers can have minimal visibility of their complex supply chains",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Due to their large volumes, retailers can offer business growth to suppliers that help them address their cost, reputational and sustainability priorities",
              "Retailers are constantly looking for innovation and product development – this opens up new value creation opportunities.",
            ],
          },
        ],
      },
    ],
  },
};

export const MANUFACTURER_PAIR = {
  manufacturer_farmer,
  manufacturer_primary,
  manufacturer_trader,
  manufacturer_retailer,
};
