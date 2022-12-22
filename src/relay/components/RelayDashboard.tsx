import type { FC } from "react";

import type {
  ApiPayload,
  ApiPayloadStats,
  ApiValidator,
  ApiValidatorStats,
} from "../api";
import { getEnv } from "../../config";
import HeaderGlow from "../../components/HeaderGlow";
import MainTitle from "../../components/MainTitle";
import AddressWidget from "./AddressWidget";
import CheckRegistrationWidget from "./CheckRegistrationWidget";
import InclusionsWidget from "./InclusionsWidget";
import ValidatorWidget from "./ValidatorWidget";
import FaqSection from "./FaqSection";
import ContactSection from "../../components/ContactSection";

export type RelayDashboardProps = {
  payloadStats: ApiPayloadStats;
  payloads: Array<ApiPayload>;
  validatorStats: ApiValidatorStats;
  validators: Array<ApiValidator>;
};

const env = getEnv();

const RelayDashboard: FC<RelayDashboardProps> = ({
  payloadStats,
  payloads,
  validatorStats,
  validators,
}) => {
  return (
    <>
      <HeaderGlow />
      <div className="container mx-auto">
        <div className="h-[48.5px] md:h-[68px]"></div>
        <MainTitle>ultra sound relay</MainTitle>
        {env === "stag" ? (
          <div
            className={`
           mt-4 text-center font-inter text-xl
           font-extralight tracking-wide
           text-slateus-400 sm:mt-0
         `}
          >
            goerli testnet
          </div>
        ) : null}
        <div className="mt-16 mb-32 flex flex-col gap-y-4 xs:px-4 md:px-16">
          <div className="mt-16 flex flex-col gap-x-4 gap-y-4 lg:flex-row">
            <div className="flex lg:w-1/2">
              <AddressWidget />
            </div>
            <div className="flex lg:w-1/2">
              <CheckRegistrationWidget />
            </div>
          </div>
          <div className="flex flex-col gap-x-4 gap-y-4 lg:flex-row">
            <div className="flex flex-col lg:w-1/2">
              <InclusionsWidget
                payloadCount={payloadStats.count}
                totalValue={payloadStats.totalValue}
                firstPayloadAt={new Date(payloadStats.firstPayloadAt)}
                payloads={payloads}
              />
            </div>
            <div className="flex flex-col lg:w-1/2">
              <ValidatorWidget {...validatorStats} validators={validators} />
            </div>
          </div>
        </div>
        <FaqSection />
        <ContactSection />
      </div>
    </>
  );
};

export default RelayDashboard;
