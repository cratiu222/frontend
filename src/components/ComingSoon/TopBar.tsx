import React, { FC, useCallback, useState } from "react";
import CountUp from "react-countup";
import { EthPrice, useBaseFeePerGas, useEthPrice } from "../../api";
import * as Format from "../../format";
import { useLocalStorage } from "../../use-local-storage";
import useNotification from "../../use-notification";
import { weiToGwei } from "../../utils/metric-utils";
import AlarmInput from "../Alarm";
import { AmountUnitSpace } from "../Spacing";
import { WidgetTitle } from "../WidgetBits";

let startGasPrice = 0;
let startGasPriceCached = 0;
let startEthPrice = 0;
let startEthPriceCached = 0;

type PriceGasWidgetProps = {
  baseFeePerGas: number | undefined;
  ethPrice: EthPrice | undefined;
};

const PriceGasWidget: FC<PriceGasWidgetProps> = ({
  baseFeePerGas,
  ethPrice: ethPrice,
}) => {
  if (baseFeePerGas && baseFeePerGas !== startGasPrice) {
    startGasPriceCached = startGasPrice;
    startGasPrice = baseFeePerGas;
  }

  if (ethPrice?.usd && ethPrice?.usd !== startEthPrice) {
    startEthPriceCached = startEthPrice;
    startEthPrice = ethPrice?.usd;
  }

  const ethUsd24hChange =
    ethPrice?.usd24hChange !== undefined
      ? Format.formatPercentOneDigitSigned(ethPrice.usd24hChange / 1000)
      : Format.formatPercentOneDigitSigned(0);

  const color =
    typeof ethPrice?.usd24hChange === "number" && ethPrice?.usd24hChange < 0
      ? "text-red-400"
      : "text-green-400";

  return (
    <div className="flex items-center font-roboto text-white rounded bg-blue-tangaroa px-3 py-2 text-xs lg:text-sm">
      <img className="pr-1" src="/gas-icon.svg" alt="gas pump icon" />
      {baseFeePerGas === undefined ? (
        "___"
      ) : (
        <CountUp
          decimals={0}
          duration={0.8}
          separator=","
          start={
            startGasPriceCached === 0
              ? weiToGwei(baseFeePerGas)
              : weiToGwei(startGasPriceCached)
          }
          end={weiToGwei(baseFeePerGas)}
        />
      )}
      <AmountUnitSpace />
      <span className="font-extralight text-blue-spindle">Gwei</span>
      <div className="mr-4"></div>
      <img className="pr-1" src="/eth-icon.svg" alt="Ethereum Ether icon" />
      {ethPrice === undefined ? (
        "_,___"
      ) : (
        <CountUp
          decimals={0}
          duration={0.8}
          separator=","
          start={
            startEthPriceCached === 0 ? ethPrice?.usd : startEthPriceCached
          }
          end={ethPrice?.usd}
        />
      )}
      <AmountUnitSpace />
      <span className="text-blue-spindle font-extralight">USD</span>
      {ethUsd24hChange === undefined ? (
        <div className="pl-1">{"(____%)"}</div>
      ) : (
        <span className={`pl-1 ${color}`}>({ethUsd24hChange})</span>
      )}
    </div>
  );
};

const TopBar: FC<{}> = () => {
  const baseFeePerGas = useBaseFeePerGas();
  const ethPrice = useEthPrice();
  const [gasAlarmActive, setGasAlarmActive] = useLocalStorage(
    "gas-alarm-enabled",
    false
  );
  const [ethAlarmActive, setEthAlarmActive] = useLocalStorage(
    "eth-alarm-enabled",
    false
  );
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  const notification = useNotification();

  const isAlarmActive = gasAlarmActive || ethAlarmActive;

  const activeButtonCss =
    "text-white border-blue-highlightborder rounded-sm bg-blue-highlightbg";
  const alarmActiveClasses = isAlarmActive ? activeButtonCss : "";

  const handleClickAlarm = useCallback(() => {
    setShowAlarmDialog(!showAlarmDialog);
  }, [showAlarmDialog]);

  const showAlarmDialogCss = showAlarmDialog ? "visible" : "invisible";

  const isAlarmValuesAvailable =
    typeof baseFeePerGas === "number" && typeof ethPrice?.usd === "number";

  return (
    <div className="flex justify-between pt-4 md:pt-8">
      <div className="relative flex">
        <PriceGasWidget baseFeePerGas={baseFeePerGas} ethPrice={ethPrice} />
        {notification.type === "Supported" && isAlarmValuesAvailable ? (
          <button
            className={`flex items-center px-3 py-2 bg-blue-tangaroa rounded ml-4 select-none border border-transparent ${alarmActiveClasses}`}
            onClick={handleClickAlarm}
          >
            <img src="/alarm-icon.svg" alt="bell icon" />
          </button>
        ) : null}
        <div
          className={`absolute w-full bg-blue-tangaroa rounded p-8 top-12 md:top-12 ${showAlarmDialogCss}`}
        >
          <WidgetTitle title="price alerts" />
          <AlarmInput
            isAlarmActive={gasAlarmActive}
            onToggleIsAlarmActive={setGasAlarmActive}
            icon="/gas-icon.svg"
            unit="Gwei"
            type="gas"
          />
          <AlarmInput
            isAlarmActive={ethAlarmActive}
            onToggleIsAlarmActive={setEthAlarmActive}
            icon="/eth-icon.svg"
            unit="USD "
            type="eth"
          />
          {notification.type === "Supported" &&
            notification.notificationPermission === "denied" && (
              <p className="text-sm text-red-400 mt-4">
                notifications disabled, please grant notification permission.
              </p>
            )}
        </div>
      </div>
      <a
        className="hidden md:block flex px-4 py-1 font-medium text-white hover:text-blue-shipcove border-white border-solid border-2 rounded-3xl hover:border-blue-shipcove"
        href="#join-the-fam"
      >
        join the fam
      </a>
    </div>
  );
};

export default TopBar;
