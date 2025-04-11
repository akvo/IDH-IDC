import React, { useState, useRef, useMemo } from "react";
import "./case-wrapper.scss";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Steps,
  Layout,
  Affix,
  Button,
  Space,
  Alert,
  Spin,
  Modal,
  Select,
  Divider,
  Table,
} from "antd";
import { ContentLayout } from "../../../components/layout";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MenuOutlined,
  SettingOutlined,
  ShareAltOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { CaseSettings, DebounceSelect } from "../components";
import { stepPath, CaseUIState } from "../store";
import { UserState } from "../../../store";
import { adminRole, casePermission } from "../../../store/static";
import { api } from "../../../lib";

const { Sider, Content } = Layout;
const buttonPrevNextPosition = "bottom";
const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const CaseSidebar = ({ step, caseId, siderCollapsed, onSave }) => {
  const navigate = useNavigate();

  const sidebarItems = useMemo(() => {
    if (siderCollapsed) {
      return [
        { title: "" },
        { title: "" },
        { title: "" },
        { title: "" },
        { title: "" },
      ];
    }
    return [
      {
        title: "Set an income target",
        description:
          "Use a living income benchmark or define the target yourself.",
      },
      {
        title: "Enter your income data",
        description:
          "Enter current and feasible data for the five income drivers and its subcomponents for each segment",
      },
      {
        title: "Understand the income gap",
        description:
          "Explore the current income situation and the gap to reach your income target.",
      },
      {
        title: "Assess impact of mitigation strategies",
        description:
          "Analyze which drivers impact income increase the most, and how to close the gap.",
      },
      {
        title: "Closing the gap",
        description:
          "Save different scenarios to close the gap, and explore procurement practices.",
      },
    ];
  }, [siderCollapsed]);

  const findStepPathValue = Object.values(stepPath).find(
    (path) => path.label === step
  )?.value;

  return (
    <div className="case-step-container">
      <Steps
        direction="vertical"
        items={sidebarItems}
        className="case-step-wrapper"
        onChange={(val) => {
          if (onSave) {
            onSave();
          }
          navigate(`/case/${caseId}/${stepPath[`step${val + 1}`].label}`);
        }}
        current={findStepPathValue ? findStepPathValue - 1 : 1}
        size="small"
      />
    </div>
  );
};

const CaseWrapper = ({ children, step, caseId, currentCase, loading }) => {
  const caseButtonState = CaseUIState.useState((s) => s.caseButton);
  const {
    id: userId,
    email: userEmail,
    role: userRole,
  } = UserState.useState((s) => s);

  const isCaseOwner =
    userEmail === currentCase?.created_by || userId === currentCase?.created_by;
  const isAdmin = adminRole.includes(userRole);

  const isInLastStep = window.location.pathname.includes(stepPath.step5.label);

  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userCaseAccessDataSource, setUserCaseAccessDataSource] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [loadingUserCase, setLoadingUserCase] = useState(false);

  const layoutSize = useMemo(() => {
    if (!siderCollapsed) {
      return { left: 4, right: 20 };
    }
    return { left: 1, right: 23 };
  }, [siderCollapsed]);

  // Use refs to store the functions
  const backFunctionRef = useRef(() => {});
  const nextFunctionRef = useRef(() => {});
  const saveFunctionRef = useRef(() => {});

  const handleBack = () => {
    backFunctionRef.current();
  };

  const handleNext = () => {
    nextFunctionRef.current();
  };

  const handleSave = () => {
    saveFunctionRef.current();
  };

  /* Support add User Access */
  const fetchUsers = (searchValue) => {
    return api
      .get(`user/search_dropdown?search=${searchValue}`)
      .then((res) => res.data);
  };

  /* Support add User Access */
  const handleOnClickAddUserCaseAccess = () => {
    if (currentCase.id) {
      setLoadingUserCase(true);
      const payload = {
        user: selectedUser?.value,
        permission: selectedPermission,
      };
      api
        .post(`case_access/${currentCase.id}`, payload)
        .then((res) => {
          setUserCaseAccessDataSource((prev) => {
            return [...prev, res.data];
          });
          setSelectedUser(null);
          setSelectedPermission(null);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoadingUserCase(false);
        });
    }
  };

  /* Support add User Access */
  const handleOnClickRemoveUserAccess = (row) => {
    if (currentCase?.id) {
      api
        .delete(`case_access/${currentCase.id}?access_id=${row.id}`)
        .then(() => {
          setUserCaseAccessDataSource((prev) => {
            return prev.filter((p) => p.id !== row.id);
          });
        });
    }
  };

  /* Support add User Access */
  const handleOnClickShareAccess = () => {
    if (currentCase?.id) {
      api.get(`case_access/${currentCase.id}`).then((res) => {
        setUserCaseAccessDataSource(res.data);
        setTimeout(() => {
          setShowShareModal(true);
        }, 100);
      });
    }
  };

  const ButtonPrevNext = () => (
    <Space>
      <Button
        disabled={caseButtonState.loading}
        onClick={handleBack}
        className="button-green-transparent"
      >
        <ArrowLeftOutlined /> Back
      </Button>
      <Button
        loading={caseButtonState.loading}
        disabled={caseButtonState.loading}
        onClick={handleNext}
        className="button-green-fill"
      >
        {isInLastStep ? (
          "Save"
        ) : (
          <>
            Next <ArrowRightOutlined />
          </>
        )}
      </Button>
    </Space>
  );

  return (
    <Row id="case-detail" className="case-container">
      <Col span={24}>
        <Row gutter={[0, 0]}>
          <Col span={layoutSize.left}>
            <Affix offsetTop={80}>
              <Sider
                className="case-sidebar-container"
                width="100%"
                collapsedWidth={65}
                collapsible={true}
                reverseArrow={true}
                trigger={null}
                collapsed={siderCollapsed}
              >
                <Button
                  icon={
                    siderCollapsed ? <MenuOutlined /> : <ArrowLeftOutlined />
                  }
                  onClick={() => setSiderCollapsed((prev) => !prev)}
                  size={siderCollapsed ? "small" : "large"}
                  className="sider-collapsed-button"
                  style={{ marginLeft: siderCollapsed ? 0 : -8 }}
                />
                <CaseSidebar
                  step={step}
                  caseId={caseId}
                  siderCollapsed={siderCollapsed}
                  onSave={handleSave}
                />
              </Sider>
            </Affix>
          </Col>
          <Col span={layoutSize.right} className="case-content-container">
            <Content>
              <ContentLayout
                // enable sider collapsed
                // siderCollapsedButton={true}
                // setSiderCollapsed={setSiderCollapsed}
                // siderCollapsed={siderCollapsed}
                // EOL enable sider collapsed
                breadcrumbItems={[
                  { title: "Home", href: "/welcome" },
                  { title: "Cases", href: "/cases" },
                  { title: currentCase?.name, href: "" },
                ]}
                breadcrumbRightContent={
                  <Space direction="vertical" align="end">
                    <div>
                      {currentCase.updated_by
                        ? `Last update by ${currentCase?.updated_by} ${
                            currentCase?.updated_at
                              ? `on ${new Date(
                                  currentCase?.updated_at
                                ).toLocaleString("en-US", options)}`
                              : ""
                          }`
                        : ""}
                    </div>
                    <Space>
                      <Button
                        className="button-green-transparent"
                        icon={<SettingOutlined />}
                        onClick={() => setCaseSettingModalVisible(true)}
                      >
                        Case settings
                      </Button>
                      {isCaseOwner || isAdmin ? (
                        <Button
                          className="button-green-transparent"
                          icon={<ShareAltOutlined />}
                          onClick={handleOnClickShareAccess}
                        >
                          Share
                        </Button>
                      ) : (
                        ""
                      )}
                      {buttonPrevNextPosition === "top" && <ButtonPrevNext />}
                    </Space>
                  </Space>
                }
              >
                {loading ? (
                  <div className="loading-container">
                    <Spin />
                  </div>
                ) : currentCase.segments.filter((s) => s.id).length ? (
                  React.isValidElement(children) ? (
                    React.cloneElement(children, {
                      setbackfunction: (fn) => (backFunctionRef.current = fn),
                      setnextfunction: (fn) => (nextFunctionRef.current = fn),
                      setsavefunction: (fn) => (saveFunctionRef.current = fn),
                    })
                  ) : null
                ) : (
                  // Show alert if current case doesn't have any segments
                  <Alert
                    message="Unable to load the page. Please add segments in the Case settings first."
                    type="warning"
                  />
                )}
              </ContentLayout>
            </Content>
          </Col>
        </Row>
      </Col>

      {/* Next Back Button Bottom */}
      {buttonPrevNextPosition === "bottom" && (
        <Col
          span={24}
          align="end"
          className="case-button-wrapper"
          style={{ textAlign: "right" }}
        >
          <ButtonPrevNext />
        </Col>
      )}

      <CaseSettings
        open={caseSettingModalVisible}
        handleCancel={() => setCaseSettingModalVisible(false)}
        enableEditCase={true}
      />

      {/* Support add User Access */}
      <Modal
        title="Share Case Access to Users"
        open={showShareModal}
        onCancel={() => setShowShareModal(false)}
        width={650}
        footer={false}
      >
        <Row gutter={[16, 16]} align="center">
          <Col span={12}>
            <DebounceSelect
              placeholder="Search for a user"
              value={selectedUser}
              fetchOptions={fetchUsers}
              onChange={(value) => setSelectedUser(value)}
              style={{
                width: "100%",
              }}
            />
          </Col>
          <Col span={8}>
            <Select
              showSearch
              value={selectedPermission}
              placeholder="Select permission"
              options={casePermission.map((x) => ({ label: x, value: x }))}
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={setSelectedPermission}
            />
          </Col>
          <Col span={4} align="end" style={{ float: "right" }}>
            <Button
              onClick={() => handleOnClickAddUserCaseAccess()}
              disabled={!selectedUser || !selectedPermission}
              loading={loadingUserCase}
            >
              Add
            </Button>
          </Col>
        </Row>
        <Divider />
        <Table
          size="small"
          columns={[
            {
              key: "user",
              title: "User",
              width: "65%",
              dataIndex: "label",
            },
            {
              key: "permission",
              title: "Permission",
              dataIndex: "permission",
            },
            {
              key: "action",
              render: (row) => {
                return (
                  <Button
                    size="small"
                    type="ghost"
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleOnClickRemoveUserAccess(row)}
                  />
                );
              },
            },
          ]}
          dataSource={userCaseAccessDataSource}
          bordered
          title={() => <b>User Case Access</b>}
          pagination={false}
          loading={loadingUserCase}
        />
      </Modal>
    </Row>
  );
};

export default CaseWrapper;
