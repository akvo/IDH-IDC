// * const name reflec the actors pair (e.g. primary actor > farmer actor become primary_farmer)

const primary_farmer = {
  sectionA: { title: "Primary/Secondary Processor" },
  sectionB: { title: "Farmer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Primary/ secondary processors can help smallholders/ farmers understand the practices and processes that impact supply security, quality and operational costs; sharing this knowledge and being prepared to provide upfront financial support can allow a farmer to improve their practices, giving better stability, longevity and quality of production to both parties",
          "Primary/secondary processors can support the convening and collaboration between farmer/ smallholders in similar regions, facilitating knowledge sharing to improve farming practices and the ability to leverage economies of scale that benefits cost and supply stability for the processor and income for the farmer",
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
              "Farmers/Smallholders have a great capacity to grow their capabilities and knowledge from peers and downstream actors",
            ],
          },
        ],
      },
    ],
  },
};

const primary_trader = {
  sectionA: { title: "Primary/Secondary Processor" },
  sectionB: { title: "Trader" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Processors that are able to mitigate sustainability risks upstream and improve supply quality and security through farmer collaboration, are able to supply traders with materials that meet the challenges of the manufacturers and retailers downstream.",
          "This helps the trader develop better relationships and demand better prices and contract with their customers, and allows a processor's work be recognised in better costs when selling their materials to the trader",
          "Processors may have to navigate the inclinations of a trader to act purely transactionally, but the potential for mutual value creation may enable them to enter a more relational process with the trader",
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

const primary_manufacturer = {
  sectionA: { title: "Primary/Secondary Processor" },
  sectionB: { title: "Manufacturer/Processor" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Primary/ secondary processors have the capability to work with farmers and smallholders to deliver on the sustainability and quality priorities that brand manufacturers rely on to protect their reputation, demand a premium on brands founded on sustainability or quality narratives, or meet legislative needs",
          "In return, primary/ secondary processors may be able to initiate or deepen direct relationships with manufacturers, enabling improved prices reflective of the value they are adding, and reducing costs for both by removing intermediate actors",
          "Manufacturers may have better resources to access technologies that would enable primary/ secondary processes implement more sustainable practices, eliminating risks for the manufacturer and allowing processors to access resources otherwise outside their reach",
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

const primary_retailer = {
  sectionA: { title: "Primary/Secondary Processor" },
  sectionB: { title: "Retailer" },
  sectionC: {
    list: [
      {
        text: "Opportunities for mutual value creation",
      },
      {
        list: [
          "Primary/ secondary processors have the capability to work with farmers and smallholders to deliver on the sustainability and quality priorities that retailers rely on to protect their reputation and/or deliver on legislative requirements",
          "In return, primary/ secondary processors may be able to initiate or deepen direct relationships with retailers, enabling improved prices reflective of the value they are adding, and reducing costs for both by removing intermediate actors",
          "Retailers may also be the conduit for primary/secondary processors to work directly with co-manufacturers, increasing the potential to grow their business with other businesses too",
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

export const PRIMARY_PAIR = {
  primary_farmer,
  primary_trader,
  primary_manufacturer,
  primary_retailer,
};
