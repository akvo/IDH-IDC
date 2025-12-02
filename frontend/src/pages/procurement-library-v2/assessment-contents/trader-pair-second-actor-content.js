// * const name reflec the actors pair (e.g. trader actor > farmer actor become trader_farmer)

const trader_farmer = {
  sectionA: { title: "Trader" },
  sectionB: { title: "Farmer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Combining a trader's ability to understand downstream actor needs and ability to connect directly to farmers provides the opportunity to engage upstream on risk mitigation, quality, supply security, to deliver better for downstream customers",
          "If a trader is able to shift from a commodity view and pure trading activities, working directly with farmers may enable them to unlock better security of supply and lower long-term prices, while also providing the income stability that farmer need to continually improve",
          "Shortening the supply chain, be developing direct farmer relationships, can also lower costs for traders simply by cutting out other actors who add more cost than value",
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

const trader_primary = {
  sectionA: { title: "Trader" },
  sectionB: { title: "Primary/Secondary Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Combining a trader’s knowledge of downstream actor’s needs with primary/ secondary processor’s ability to engage and leverage economies of scale with farmers could enable collaboration and implementation of actions that lower risk and improve supply stability. A trader may be able to secure higher prices for materials that deliver these benefits to downstream actors, providing the finance needed to initiate",
          "Shifting from transactional to relational practices with primary/secondary processors may help a trader lower their costs, by cutting out other intermediaries or being able to agree longer-term contracts, and provide processors with better financial stability",
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
              "Primary/secondary processors can be especially vulnerable to local conditions e.g. climate, economic, politics due to their size and limited operating area",
            ],
          },
          {
            title: "Capabilities",
            list: [
              "Primary/secondary processors often have direct, or close to, relationships with farmers, allowing collaboration on implementing actions",
              "Primary/secondary processors can be the first point in a value chain that multiple farmer outputs are brought together, creating the possibility to leverage economies of scale across individual farms",
            ],
          },
        ],
      },
    ],
  },
};

const trader_manufacturer = {
  sectionA: { title: "Trader" },
  sectionB: { title: "Manufacturer/Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Traders can provide the links to upstream actors that manufacturers need to improve their supply chain visibility and implement actions to mitigate risks and comply with legislation; collaborating to facilitate this work may improve business relationships and facilitate better commercial terms",
          "A manufacturer’s ability to influence consumer perception of product value based on sustainability attributes may enable the payment of higher prices for materials that a trader can help ensure come from certifiable origins",
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
              "Brand manufacturers are exposed to reputational risks amongst consumers",
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

const trader_retailer = {
  sectionA: { title: "Trader" },
  sectionB: { title: "Retailer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Traders can provide the links to upstream actors that retailers need to improve their supply chain visibility and implement actions to mitigate risks and comply with legislation; collaborating to facilitate this work may improve business relationships and facilitate better commercial terms",
          "The high volumes and need to respond to changing consumer preferences that retailers face opens the opportunity to increase business for traders that can support retailers navigating these challenges; a trader that can leverage their ability to connect quickly to multiple material suppliers and is willing to lean in enough to ensure that doing so doesn’t introduce sustainability risks into the retailer’s supply chain may be able to grow their business with the retailer",
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
              "Retailers are constantly looking for innovation and product development - this opens up new value creation opportunities.",
            ],
          },
        ],
      },
    ],
  },
};

export const TRADER_PAIR = {
  trader_farmer,
  trader_primary,
  trader_manufacturer,
  trader_retailer,
};
