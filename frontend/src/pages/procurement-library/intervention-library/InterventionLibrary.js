import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Pagination, Select, Space, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "../../../lib/icon";
import { api } from "../../../lib";
import { ImpactAreaIcons, ProcurementBadge } from "../components";
import "./intervention-library.scss";
import { IMPACT_AREA_OPTIONS } from "../config";

const PAGE_SIZE = 9;
const { useForm } = Form;

const InterventionLibrary = () => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [practices, setPractices] = useState([]);
  const [totalPage, setTotalPage] = useState(0);
  const [procurementProcesses, setProcurementProcesses] = useState([]);

  const [form] = useForm();
  const navigate = useNavigate();

  const fetchProcurementProcesses = useCallback(async () => {
    try {
      const { data } = await api.get("/pl/procurement-processes");
      setProcurementProcesses(
        data.map((proc) => ({
          value: proc.id,
          label: proc.label,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(
    async (filter = {}) => {
      try {
        let apiURL = `/pl/practices?limit=${PAGE_SIZE}`;
        if (filter?.search) {
          apiURL += `&search=${filter.search}`;
        }
        if (filter?.procurement_process_ids) {
          apiURL += `&procurement_process_ids=${filter.procurement_process_ids.join(
            ","
          )}`;
        }
        if (filter?.impact_area) {
          apiURL += `&impact_area=${filter.impact_area}`;
        }

        apiURL += Object.keys(filter).length > 0 ? "&page=1" : `&page=${page}`;
        const { data: apiData } = await api.get(apiURL);
        const { current, total, data } = apiData;
        setPractices(data);
        setPage(current);

        setTotalPage(total);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    },
    [page]
  );

  const handleOnFinish = (filter) => {
    setLoading(true);
    setPage(1);
    fetchData(filter);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProcurementProcesses();
  }, [fetchProcurementProcesses]);

  return (
    <div className="intervention-library-container">
      <div className="intervention-library-header">
        <ul>
          <li>Procurement Library</li>
          <li className="active">Library</li>
        </ul>
      </div>
      <div className="intervention-library-content">
        <div className="intervention-library-content-header">
          <h1>The Intervention Library</h1>
          <Form form={form} onFinish={handleOnFinish} layout="vertical">
            <Form.Item
              label="Procurement practice title or keyword"
              name="search"
            >
              <Input placeholder="Search" />
            </Form.Item>
            <Form.Item
              label="Procurement Process"
              name="procurement_process_ids"
            >
              <Select
                placeholder="Choose procurement process"
                mode="multiple"
                options={procurementProcesses}
                allowClear
              />
            </Form.Item>
            <Form.Item label="Impact area" name="impact_area">
              <Select
                placeholder="Choose impact area"
                options={IMPACT_AREA_OPTIONS}
                allowClear
              />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              <Space>
                <span>Search</span>
                <span>
                  <ArrowRight />
                </span>
              </Space>
            </Button>
          </Form>
        </div>
        <div className="intervention-library-content-body">
          <Spin spinning={loading}>
            {practices?.map((practice) => (
              <div key={practice.id} className="intervention-card">
                <div className="intervention-card-header">
                  <div className="intervention-card-categories">
                    {practice?.procurement_processes?.map((proc) => (
                      <ProcurementBadge
                        key={proc?.id}
                        id={proc?.id}
                        text={proc?.label}
                      />
                    ))}
                  </div>
                  <ImpactAreaIcons
                    isIncome={practice?.is_income}
                    isEnv={practice?.is_environmental}
                  />
                </div>
                <div
                  className="intervention-card-description"
                  role="button"
                  onClick={() => {
                    navigate(
                      `/procurement-library/intervention-library/${practice.id}`
                    );
                  }}
                >
                  <strong className="font-tablet-gothic">
                    {practice.label}
                  </strong>
                </div>
                <div className="intervention-card-footer">
                  <Button
                    type="link"
                    onClick={() => {
                      navigate(
                        `/procurement-library/intervention-library/${practice.id}`
                      );
                    }}
                  >
                    <Space>
                      <span>View</span>
                      <span>
                        <ArrowRight />
                      </span>
                    </Space>
                  </Button>
                </div>
              </div>
            ))}
          </Spin>
        </div>
        <div className="intervention-library-content-footer">
          <Pagination
            pageSize={PAGE_SIZE}
            current={page}
            total={totalPage}
            onChange={(p) => {
              setLoading(true);
              setPage(p);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InterventionLibrary;
