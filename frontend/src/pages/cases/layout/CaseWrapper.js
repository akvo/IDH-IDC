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
  message,
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
import { stepPath, CaseUIState, CurrentCaseState } from "../store";
import { UserState } from "../../../store";
import {
  adminRole,
  casePermission,
  caseStepItems,
} from "../../../store/static";
import { api } from "../../../lib";
import { usePiwikTrackPageTime } from "../../../hooks";
import { routePath } from "../../../components/route";
import { IDCSubMenu } from "../components";

const { Sider, Content } = Layout;
const buttonPrevNextPosition = "bottom";
const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const step1CheckWarningText =
  "Please complete Step 1 by setting the segment target before proceeding.";

const hideStep2ForExternalUser = false;

const CaseSidebar = ({ step, caseId, siderCollapsed, onSave, messageApi }) => {
  const navigate = useNavigate();
  const currentCaseSegments = CurrentCaseState.useState((s) => s.segments);
  const { id: userId, internal_user: isInternalUser } = UserState.useState(
    (s) => s
  );

  const sidebarItems = useMemo(() => {
    let res = [];
    if (siderCollapsed) {
      res = [
        { title: "" },
        { title: "" },
        { title: "" },
        { title: "" },
        { title: "" },
      ];
    } else {
      res = caseStepItems;
    }
    if (hideStep2ForExternalUser && userId && !isInternalUser) {
      // remove step 2 from sidebar for external user
      return res.filter((_, i) => i !== 1);
    }
    return res;
  }, [siderCollapsed, userId, isInternalUser]);

  const findStepPathValue = useMemo(() => {
    let current = Object.values(stepPath).find(
      (path) => path.label === step
    )?.value;
    if (hideStep2ForExternalUser && userId && !isInternalUser && current > 1) {
      // remove step 2 from sidebar for external user
      current -= 1;
    }
    return current;
  }, [step, userId, isInternalUser]);

  const handleOnChangeSteps = (val) => {
    // check segment target before move to step 2 forward
    const segmentWithNoTarget = currentCaseSegments.filter(
      (segment) => !segment.target
    );
    if (segmentWithNoTarget?.length > 0 && findStepPathValue === 1) {
      messageApi.open({
        type: "warning",
        content: step1CheckWarningText,
      });
      return;
    }
    // EOL check segment target before move to step 2 forward
    if (onSave) {
      onSave();
    }
    let stepPathNumber = val + 1;
    if (hideStep2ForExternalUser && userId && !isInternalUser && val > 0) {
      // remove step 2 from sidebar for external user
      stepPathNumber += 1;
    }
    navigate(
      `${routePath.idc.case}/${caseId}/${
        stepPath[`step${stepPathNumber}`].label
      }`
    );
  };

  return (
    <div className="case-step-container">
      <p>
        <small style={{ fontSize: "13px" }}>
          Click to preview different steps in the IDC analysis
        </small>
      </p>
      <Steps
        direction="vertical"
        items={sidebarItems}
        className="case-step-wrapper"
        onChange={handleOnChangeSteps}
        current={findStepPathValue ? findStepPathValue - 1 : 1}
        size="small"
      />
    </div>
  );
};

const CaseWrapper = ({ children, step, caseId, currentCase, loading }) => {
  // track time
  usePiwikTrackPageTime();

  const caseButtonState = CaseUIState.useState((s) => s.caseButton);
  const {
    id: userId,
    email: userEmail,
    role: userRole,
  } = UserState.useState((s) => s);

  const isCaseOwner =
    userEmail === currentCase?.created_by || userId === currentCase?.created_by;
  const isAdmin = adminRole.includes(userRole);

  const isInFirstStep = window.location.pathname.includes(stepPath.step1.label);
  const isInLastStep = window.location.pathname.includes(stepPath.step5.label);

  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userCaseAccessDataSource, setUserCaseAccessDataSource] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [loadingUserCase, setLoadingUserCase] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const showCaseSettings = [stepPath.step1.label, stepPath.step2.label].some(
    (path) => window.location.pathname.includes(path)
  );

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
    // check segment target before move to step 2 forward
    const segmentWithNoTarget = currentCase?.segments?.filter(
      (segment) => !segment.target
    );
    if (isInFirstStep && segmentWithNoTarget?.length > 0) {
      messageApi.open({
        type: "warning",
        content: step1CheckWarningText,
      });
      return;
    }
    // EOL check segment target before move to step 2 forward
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
        style={{ display: isInFirstStep ? "none" : "" }}
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
      {contextHolder}

      {/* SUB MENU */}
      <IDCSubMenu />
      {/* EOL SUB MENU */}

      <Col span={24}>
        <Row gutter={[0, 0]}>
          <Col span={layoutSize.left}>
            <Affix offsetTop={140}>
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
                  messageApi={messageApi}
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
                  { title: "Home", href: routePath.idc.dashboard },
                  { title: "Cases", href: routePath.idc.cases },
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
                      {showCaseSettings ? (
                        <Button
                          className="button-green-fill"
                          icon={<SettingOutlined />}
                          onClick={() => setCaseSettingModalVisible(true)}
                        >
                          Update Case Details
                        </Button>
                      ) : (
                        ""
                      )}
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
                hideIDCSubMenu={true}
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
        title="Share this case with others"
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
          title={() => <b>Users who can access this case</b>}
          pagination={false}
          loading={loadingUserCase}
        />
      </Modal>
    </Row>
  );
};

export default CaseWrapper;
