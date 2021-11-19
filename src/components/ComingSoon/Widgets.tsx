import React, { FC, useState, useCallback } from "react";
import { useBaseFeePerGas } from "../../api";
import { weiToGwei } from "../../utils/metric-utils";
import TimeFrameControl, { TimeFrame, timeFrames } from "../TimeFrameControl";
import BurnGauge from "../Gauges/BurnGauge";
import IssuanceGauge from "../Gauges/IssuanceGauge";
import SupplyGrowthGauge from "../Gauges/SupplyGrowthGauge";
import BurnLeaderboard from "../BurnLeaderboard";
import FeeBurn from "../FeeBurn";
import LatestBlocks from "../LatestBlocks";
import { WidgetBackground } from "../WidgetBits";
import CurrencyControl, { Unit } from "./CurrencyControl";
import Flippenings from "./Flippenings";

const Widgets: FC = () => {
  const [simulateMerge, setSimulateMerge] = useState(false);
  const baseFeePerGas = useBaseFeePerGas();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("24h");
  const [unit, setUnit] = useState<Unit>("eth");

  const onSetTimeFrame = useCallback(setTimeFrame, [setTimeFrame]);

  const onSetUnit = useCallback(setUnit, [setUnit]);

  const toggleSimulateMerge = useCallback(() => {
    setSimulateMerge(!simulateMerge);
  }, [simulateMerge]);

  if (typeof window !== "undefined" && baseFeePerGas !== undefined) {
    document.title =
      weiToGwei(baseFeePerGas).toFixed(0) + " Gwei | ultrasound.money";
  }

  const handleClickTimeFrame = useCallback(() => {
    const currentTimeFrameIndex = timeFrames.indexOf(timeFrame);
    const nextIndex =
      currentTimeFrameIndex === timeFrames.length - 1
        ? 0
        : currentTimeFrameIndex + 1;

    setTimeFrame(timeFrames[nextIndex]);
  }, [timeFrame]);

  return (
    <>
      <div className="w-full flex flex-col md:flex-row md:gap-0 lg:gap-4 px-4 md:px-16 isolate">
        <div className="hidden md:block w-1/3">
          <BurnGauge timeFrame={timeFrame} unit={unit} />
        </div>
        <div className="md:w-1/3">
          <SupplyGrowthGauge
            onClickTimeFrame={handleClickTimeFrame}
            simulateMerge={simulateMerge}
            timeFrame={timeFrame}
            toggleSimulateMerge={toggleSimulateMerge}
          />
        </div>
        <div className="hidden md:block w-1/3">
          <IssuanceGauge
            simulateMerge={simulateMerge}
            timeFrame={timeFrame}
            unit={unit}
          />
        </div>
      </div>
      <div className="w-4 h-4" />
      <div className="px-4 md:px-16">
        <WidgetBackground>
          <div className="flex flex-col gap-y-8 md:flex-row lg:gap-y-0 justify-between">
            <div className="flex flex-col gap-y-4 lg:gap-x-4 lg:flex-row lg:items-center">
              <p className="font-inter font-light text-blue-spindle text-md uppercase">
                time frame
              </p>
              <TimeFrameControl
                selectedTimeframe={timeFrame}
                onSetFeePeriod={onSetTimeFrame}
              />
            </div>
            <div className="flex flex-col gap-y-4 lg:gap-x-4 lg:flex-row lg:items-center">
              <p className="font-inter font-light text-blue-spindle text-md uppercase md:text-right lg:text-left">
                currency
              </p>
              <CurrencyControl selectedUnit={unit} onSetUnit={onSetUnit} />
            </div>
          </div>
        </WidgetBackground>
      </div>
      <div className="w-4 h-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 px-4 md:px-16 md:gap-x-4 lg:w-full lg:flex-row">
        <FeeBurn
          onClickTimeFrame={handleClickTimeFrame}
          simulateMerge={simulateMerge}
          timeFrame={timeFrame}
          unit={unit}
        />
        <div className="lg:col-start-2 lg:row-start-1 lg:row-end-4">
          <BurnLeaderboard
            onClickTimeFrame={handleClickTimeFrame}
            timeFrame={timeFrame}
            unit={unit}
          />
        </div>
        <LatestBlocks unit={unit} />
        <Flippenings />
      </div>
    </>
  );
};

export default Widgets;
