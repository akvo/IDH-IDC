import React from "react";
import { Row, Col, Checkbox } from "antd";
import { passwordCheckBoxOptions } from ".";

const PasswordCriteria = ({ values = [], className = "" }) => {
  return (
    <Row
      align="middle"
      justify="space-between"
      gutter={[16, 16]}
      className={`password-criteria-wrapper ${className}`}
    >
      <Col span={24} align="start">
        <p>
          <u>Criteria for the password</u>
        </p>
        <Checkbox.Group
          className={`checkbox-criteria ${className}`}
          options={passwordCheckBoxOptions.map((x) => x.name)}
          value={values}
        />
      </Col>
    </Row>
  );
};

export default PasswordCriteria;
