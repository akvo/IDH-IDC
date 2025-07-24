import "./blocker.scss";
import { Card, Image } from "antd";
import { Link } from "react-router-dom";
import WarningIcon from "../../assets/icons/warning.svg";
import { routePath } from "../../components/route";

const Blocker = () => {
  return (
    <div className="blocker-wrapper">
      <Card>
        <Image src={WarningIcon} preview={false} width={90} />
        <div className="title">Screen is too small</div>
        <div className="subtitle">
          It&apos;s recommended that you use this platform on a desktop or
          laptop.
        </div>
        <div>
          <Link to={routePath.idc.landing} className="button button-green">
            Back to the main page
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Blocker;
