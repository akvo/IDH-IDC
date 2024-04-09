import React from "react";
import { Modal, Space, Divider } from "antd";

const dataSecurityProvisionText = [
  {
    subTitle: "Privacy statement",
    content: (
      <p>
        IDH is committed to upholding data privacy principles and protecting
        personal data in accordance with applicable data protection laws and
        regulations. We recognize the importance of maintaining the
        confidentiality and security of individual data within the Income Driver
        Calculator and we strive to maintain transparency regarding the use and
        purpose of the data processing. Please click{" "}
        <a
          href="https://www.idhsustainabletrade.com/privacy-statement/"
          target="_blank"
          rel="noreferrer noopener"
        >
          here
        </a>{" "}
        to access IDH&apos;s privacy statement.
      </p>
    ),
  },
  {
    subTitle: "Disclaimer",
    content: (
      <p>
        By agreeing to this disclaimer, you acknowledge that the Income Driver
        Calculator is dependent and based on third party content providers, such
        as [general description of providers of data used for the Income Driver
        Calculator (IDC). All information provided by and contained in the IDC
        is provided on an &quot;as is&quot;, &quot;with all faults&quot;, and
        &quot;as available&quot; basis and could potentially entail incorrect or
        incomplete information. The results of the calculations represented in
        the IDC each have their own approach for calculating the relevant
        outcomes and are not developed or owned by IDH, nor do they reflect the
        opinion or approach of IDH or its employees. IDH strives to stimulate
        third parties to provide the correct information, but does not provide
        any representation, guarantee or warranty of any kind as to the
        accuracy, validity, completeness, or timeliness of information contained
        in or provided through the IDC. You expressly agree that the use of the
        IDC is at your sole risk. To the fullest extent permitted by law, IDH
        assumes no responsibility or liability of any kind for any errors,
        omissions, faults, inaccuracies in the information provided by and
        contained in the IDC, [including but not limited to the display of [e.g.
        third-party living wage benchmarks or any information contained in the
        IDC reports and/or calculations]. Furthermore, none of the contributors,
        administrators, or anyone else connected with the IDC in any way
        whatsoever can be responsible for the appearance of any inaccurate
        information or for your use of the information contained in or provided
        through the IDC.
      </p>
    ),
  },
  {
    subTitle: "Confidentiality",
    content: (
      <p>
        As a user of the IDC, unless you have indicated that you specifically
        wish to share your data with (a) certain organisation(s) (see also
        below), the individual data you provide will not be accessible for
        anyone other than the company responsible for managing the IDC&apos;s
        data storage and collection (Akvo) and a limited group of authorized IDH
        employees, as needed for the fulfilment of their tasks, who are under
        confidentiality obligations.
      </p>
    ),
  },
  {
    subTitle: "Ownership of data",
    content: (
      <>
        <p>
          As a user of the IDC, you will retain full ownership of your data.
          Upon your request, IDH can permanently delete your data at any time.
          Deleted data will no longer be part of any database or included in any
          new reports from the moment of deletion onwards. Please note that data
          and reports generated and shared prior to deletion cannot be undone.
        </p>
        <p>
          <i>Individual and non-aggregated data: usage and sharing</i>
          <br />
          Individual non-aggregated collected through the IDC will not be shared
          by IDH, except as explicitly authorized by the user. For the purpose
          of furthering IDH&apos;s (potential commercial) endeavours and
          services aimed towards addressing [e.g. living income gaps], IDH may
          request your approval to have your individual data shared with a
          specific entity or organisation that you are connected to. Upon such a
          request, IDH will provide you with a transparent overview of the
          relevant data (points) in question and the use. IDH and the IDC
          development partner [Akvo] may use data derived from the IDC to
          improve and develop IDH&apos;s products (and potential services)
          continually and to solve reported technical improvements needed.
        </p>
        <p>
          <i>Anonymized and aggregated data: usage and sharing </i>
          <br />
          In addition to the above, IDH may utilize aggregated and anonymized
          (stripped of any personally identifiable information) data collected
          through the [IDC] to further its (potential commercial) endeavours and
          services aimed towards addressing its goals on improving incomes for
          small holder farmers [e.g. living income gaps]. In particular, IDH may
          sell, publish, and/or share with its clients, informative reports and
          analyses based on aggregated and anonymized data in an effort to
          inform the public, to raise awareness about living income and related
          socio-economic issues and to provide valuable insights into living
          income trends and patterns. By sharing such insights, IDH aims to
          foster conversations and encourage positive changes.
        </p>
      </>
    ),
  },
  {
    subTitle: "No advice",
    content: (
      <p>
        The information contained in and provided by the [IDC] is not intended
        to be a source of advice. If you need specific advice, please seek a
        professional who is licensed or knowledgeable in that area.
      </p>
    ),
  },
  {
    subTitle: "Legal access",
    content: (
      <p>
        The IDC is built on a Google Cloud Platform. The laws in your country or
        jurisdiction may or may not allow access to domains owned by Google
        Cloud Platform, and therefore to the IDC. IDH does not encourage the
        violation of any laws and cannot be held responsible for any violations
        or circumvention of such laws.
      </p>
    ),
  },
  {
    subTitle: "Questions option",
    content: (
      <p>
        If you have any questions or comments, please contact our team at your
        respective point of communication at IDH or email us at{" "}
        <a
          href="mailto:livingincome@idhtrade.org"
          target="_blank"
          rel="noreferrer noopener"
        >
          livingincome@idhtrade.org
        </a>{" "}
        with subject reference &quot;IDC&quot;.
      </p>
    ),
  },
];

const DataSecurityProvisionModal = ({
  visible,
  setVisible,
  onAgree = () => {},
}) => {
  return (
    <Modal
      title="Privacy statement and disclaimer for Income Driver Calculator "
      centered
      open={visible}
      width="70%"
      closable={false}
      maskClosable={false}
      onOk={() => {
        onAgree(true);
        setVisible(false);
      }}
      onCancel={() => {
        onAgree(false);
        setVisible(false);
      }}
      okText="Agree"
    >
      <Space direction="vertical">
        {dataSecurityProvisionText.map((x, xi) => {
          return (
            <div key={`dsp-${xi}`}>
              <h4>{`${xi + 1}. ${x.subTitle}`}</h4>
              <div>{x.content}</div>
            </div>
          );
        })}
      </Space>
      <Divider />
      <i>
        By clicking the &quot;Agree&quot; button, you agree with the storage,
        handling and sharing of the data provided by you through the IDC in
        accordance with the statements above and IDH&apos;s{" "}
        <a
          href="https://www.idhsustainabletrade.com/privacy-statement/"
          target="_blank"
          rel="noreferrer noopener"
        >
          privacy statement
        </a>
        .
      </i>
    </Modal>
  );
};

export default DataSecurityProvisionModal;
