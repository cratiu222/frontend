import type { FC, RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { usePopper } from "react-popper";
import type { ReactZoomPanPinchRef} from "react-zoom-pan-pinch";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { FullScreenHandle} from "react-full-screen";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import type { FamProfile } from "../../api/profiles";
import { useProfiles } from "../../api/profiles";
import { useActiveBreakpoint } from "../../utils/use-active-breakpoint";
import Modal from "../Modal";
import FamTooltip from "../FamTooltip";
import Twemoji from "../Twemoji";
import { WidgetBackground, WidgetTitle } from "../WidgetSubcomponents";
import BasicErrorBoundary from "../BasicErrorBoundary";
import SectionDivider from "../SectionDivider";
import ClickAwayListener from "react-click-away-listener";
import SpriteWithOnClickTooltip from "../SpriteWithOnClickTooltip";
import followingYouStyles from "../FollowingYou/FollowingYou.module.scss";
import coordinates from '../../../public/sprite/coordinates.json'
import properties from '../../../public/sprite/properties.json'
import Button from '../../components/BlueButton'
import ControlButtons from "./ControlButtons";

// See if merging with leaderboards tooltip makes sense after making it more generic.
export const useTooltip = () => {
  const { md } = useActiveBreakpoint();
  const [refEl, setRefEl] = useState<HTMLImageElement | null>(null);
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(refEl, popperEl, {
    placement: "right",
    modifiers: [
      {
        name: "flip",
      },
    ],
  });
  const [selectedItem, setSelectedItem] = useState<FamProfile>();
  const [showTooltip, setShowTooltip] = useState(false);
  const onTooltip = useRef<boolean>(false);
  const onImage = useRef<boolean>(false);

  const handleImageClick = useCallback(
    (profile: FamProfile, ref: RefObject<HTMLImageElement>) => {
      // The ranking data isn't there yet so no tooltip can be shown.
      if (profile === undefined) {
        return;
      }

      // onImage.current = true;
      // wait for the click-a-way event to fire before showing the tooltip
      const id = window.setTimeout(() => {
        if (!showTooltip && !onTooltip.current) {
          setRefEl(ref.current);
          setSelectedItem(profile);
          setShowTooltip(true);
        } else {
          setShowTooltip(false);
          setSelectedItem(undefined);
        }
      }, 50);

      return () => window.clearTimeout(id);
    },
    [showTooltip, setShowTooltip, setSelectedItem, setRefEl, onTooltip],
  );

  const handleClickAway = useCallback(() => {
    onImage.current = false;

    if (!onImage.current && !onTooltip.current) {
      setShowTooltip(false);
      setSelectedItem(undefined);
    }
  }, [onImage, onTooltip]);

  const handleTooltipEnter = useCallback(() => {
    onTooltip.current = true;
  }, []);

  const handleTooltipLeave = useCallback(() => {
    onTooltip.current = false;

    // Delayed hide.
    const id = window.setTimeout(() => {
      if (!onImage.current && !onTooltip.current) {
        setShowTooltip(false);
        setSelectedItem(undefined);
      }
    }, 200);

    return () => window.clearTimeout(id);
  }, [onImage, onTooltip]);

  return {
    attributes,
    // handleClickImage,
    handleImageClick,
    handleClickAway,
    handleTooltipEnter,
    handleTooltipLeave,
    selectedItem,
    setPopperEl,
    setSelectedItem,
    showTooltip,
    popperStyles: styles,
  };
};

const TwitterFam: FC = () => {
  const profiles = useProfiles()?.profiles;
  const { md } = useActiveBreakpoint();
  const fullScreenHandle = useFullScreenHandle();

  // Copy batsound feedback
  const [searchValue, setSearchValue] = useState("");
  const [isCopiedFeedbackVisible, setIsCopiedFeedbackVisible] = useState(false);
  const [currentProfileShow, setCurrentProfileShow] = useState<number>(0);
  const onBatSoundCopied = () => {
    setIsCopiedFeedbackVisible(true);
    setTimeout(() => setIsCopiedFeedbackVisible(false), 800);
  };

  // Support profile skeletons.
  const currentProfiles =
    // eslint-disable-next-line no-constant-condition
    (profiles === undefined)
      ? (new Array(1000).fill(undefined) as undefined[])
      : profiles;
  // const currentProfiles = new Array(1000).fill(undefined) as undefined[]

  const {
    attributes,
    // handleClickImage,
    handleImageClick,
    handleClickAway,
    popperStyles,
    selectedItem,
    setPopperEl,
    setSelectedItem,
    showTooltip,
  } = useTooltip();

  const panZoomRef = useRef<ReactZoomPanPinchRef>(null);

  const generateImageKeyfromUrl = (url: string | undefined) => {
    // i.e. https://pbs.twimg.com/profile_images/1537478481096781825/J1BDruLr.png
    if (url?.includes('default_profile_images')) {
      return 'default_profile-images.png';
    }
    const userId = url?.split('profile_images')?.[1]?.split('/')[1]; // i.e. 1579896394919383051
    const fileName = `${userId}-::-${url?.split('profile_images')?.[1]?.split('/')[2]}`; // i.e. 1579896394919383051-::-ahIN3HUB.jpg
    return `profile_images/${fileName}`;
  }

  const getXAndY = (imageUrl: string | undefined, sizeFactor: number) => {
    if (imageUrl !== undefined) {
      const key = generateImageKeyfromUrl(imageUrl);
      let x = coordinates?.[key as keyof typeof coordinates]?.x / sizeFactor;
      let y = coordinates?.[key as keyof typeof coordinates]?.y / sizeFactor;
      // x is going right to left not left to right
      x = properties?.width / sizeFactor - x;
      // y is going bottom to top not top to bottom
      y = properties?.height / sizeFactor - y;
      if (Number.isNaN(x)) {
        x = coordinates?.['profile_images/default_profile-images.png' as keyof typeof coordinates ]?.x / sizeFactor;
        x = properties?.width / sizeFactor - x;
        y = coordinates?.['profile_images/default_profile-images.png' as keyof typeof coordinates ]?.y / sizeFactor;
        y = properties?.height / sizeFactor - y;
      }
      return { x, y };
    }
    return { x: null, y: null };
  }
  
  const filteredProfiles = useMemo(() => {
    // remove an @ if user started with it
    let cleanSearchValue = searchValue;
    if (searchValue.startsWith("@")) {
      cleanSearchValue = searchValue.slice(1);
    }
    // return all profiles if search is empty
    if (cleanSearchValue === "") {
      return profiles || [];
    }
    // filter profiles
    if (profiles) {
      return profiles?.filter((profile) => {
        if (profile === undefined) {
          return false;
        }
        // search by name or handle (case insensitive)
        const lcSearchValue = cleanSearchValue.toLowerCase();
        return profile.name.toLowerCase().includes(lcSearchValue) || profile.handle.toLowerCase().includes(lcSearchValue);
      });
    }
    return [];
  }, [profiles, searchValue]);
  const filteredProfilesCount = filteredProfiles?.length;

  return (
    <>
      <SectionDivider
        title="join the fam"
      />
      <BasicErrorBoundary>
        <div className="flex flex-col gap-y-4 lg:flex-row lg:gap-x-4 w-full">
          <div className="flex basis-1/2 flex-col gap-y-4">
            <WidgetBackground>
              <WidgetTitle>FAM COUNT</WidgetTitle>
              <div className="mt-4 flex flex-col gap-y-4">
                <div className="h-1"></div>
                <h1 className="mb-4 text-2xl font-light text-white md:text-3xl xl:text-41xl">
                  {profiles?.length?.toLocaleString("en-US")} <span className="text-slateus-400 font-extralight text-2xl md:text-2xl xl:text-4xl">members</span>
                </h1>
              </div>
            </WidgetBackground>
          </div>
          <div className="flex basis-1/2 flex-col gap-y-4">
            <WidgetBackground>
              <WidgetTitle>WEAR THE BAT SIGNAL</WidgetTitle>
              <div className="flex flex-row justify-between">
                <div className="mt-4 flex flex-col gap-y-4">
                  <div className="h-1"></div>
                  <h1 className="mb-2 text-center text-2xl font-light text-white md:text-3xl xl:text-41xl">
                    <Twemoji className="flex gap-x-1" imageClassName="w-11" wrapper>
                      🦇🔊
                    </Twemoji>
                  </h1>
                </div>
                <div className="mt-4 flex flex-col gap-y-4">
                  <div className="h-1"></div>
                  <CopyToClipboard text={"🦇🔊"} onCopy={onBatSoundCopied}>
                    <div>
                      <Button>
                        {isCopiedFeedbackVisible ? 'copied!' : 'copy'}
                      </Button>
                    </div>
                  </CopyToClipboard>
                </div>
              </div>
            </WidgetBackground>
          </div>
        </div>
      </BasicErrorBoundary>
      <div className="h-12" />
      <BasicErrorBoundary>
        <TransformWrapper
          ref={panZoomRef}
          initialScale={3}
          initialPositionX={0}
          initialPositionY={0}
          wheel={{ wheelDisabled: true }}
          // panning={{ excluded: [...filteredProfiles.map((profile) => `handle-className-${profile.handle.toLowerCase()}`)] }}
          // onZoomStop={handleOnZoomStop}
        >
          {({ zoomIn, zoomOut, resetTransform, zoomToElement }) => {

            const reportScreenChange = (state: boolean, handle: FullScreenHandle) => {
              if (handle === fullScreenHandle && !state) {
                console.log('full screen off')
                resetTransform();
              }
            };

            return (
              <>
                <FullScreen
                  handle={fullScreenHandle}
                  className="bg-slateus-700"
                  onChange={reportScreenChange}
                >
                  <WidgetBackground className="w-full">
                    <div className="flex justify-between">
                      <WidgetTitle className="self-center">FAM EXPLORER</WidgetTitle>
                      <ControlButtons
                        zoomIn={zoomIn}
                        zoomOut={zoomOut}
                        resetTransform={resetTransform}
                        fullScreenHandle={fullScreenHandle}
                      />
                      {/* {searchValue && (
                        <WidgetTitle className="lowercase text-emerald-400">{filteredProfilesCount} matches</WidgetTitle>
                      )} */}
                    </div>
                    <div
                      className={`
                        flex
                        flex-wrap
                        justify-center
                        my-5
                      `}
                    >
                      <TransformComponent
                        wrapperStyle={{ height: fullScreenHandle.active ? 'calc(100vh - 175px)' : 500, cursor: "move", width: '100%' }}
                      >
                        {currentProfiles?.map((profile, index) => (
                          <ClickAwayListener onClickAway={handleClickAway} key={profile?.profileUrl ?? index}>
                            <SpriteWithOnClickTooltip
                              className={`m-[2px] h-3 w-3 select-none`}
                              imageUrl={profile?.profileImageUrl}
                              handle={profile?.handle}
                              isDoneLoading={profile !== undefined}
                              skeletonDiameter="20px"
                              onClick={(ref) =>
                                !md || profile === undefined
                                  ? () => undefined
                                  : handleImageClick(profile, ref)
                              }
                              currentScale={panZoomRef.current?.state?.scale}
                              getXAndY={getXAndY}
                              excluded={filteredProfiles?.findIndex((p) => p.name === profile?.name) === -1}
                            />
                          </ClickAwayListener>
                        ))}
                      </TransformComponent>
                      {/* Search for your profile form */}
                      <div
                        className={`
                          mt-6
                        `}
                      >
                        <form
                          className={`
                            flex
                            justify-center
                          `}
                          onSubmit={(event) => {
                            console.log('event:', event);
                            event.preventDefault();
                            const el = filteredProfiles?.[currentProfileShow]?.handle.toLowerCase()
                            if (el) {
                              zoomToElement(document.getElementById(el) || '', 3);
                              setCurrentProfileShow((prev: number) => {
                                if (prev === filteredProfilesCount - 1) {
                                  return 0;
                                }
                                return prev+1
                              });
                            }
                          }}
                        >
                          <input
                            className="rounded-full border border-gray-500 bg-transparent p-4 pr-32 text-xs text-white md:w-96"
                            type="text"
                            placeholder="@vitalikbuterin"
                            value={searchValue}
                            spellCheck="false"
                            // onChange={(event) => setSearchValue(event.target.value)}
                            onChange={(event) => {
                              setSearchValue(event.target.value);
                              setCurrentProfileShow(0);
                            }}
                          />
                          <button
                            className={`
                              ${followingYouStyles.showMe}
                              ${searchValue && filteredProfilesCount > 0 ? `!-ml-[182px]` : `!-ml-[134px]`}
                              select-none rounded-full
                              border border-white
                              bg-transparent px-5
                              text-xs text-white
                              hover:bg-gray-700
                              ${searchValue && filteredProfilesCount > 0 ? `md:w-44` : `md:w-32`}
                              disabled:opacity-50
                            `}
                            type="submit"
                            disabled={!searchValue || (searchValue.length > 0 && filteredProfilesCount === 0)}
                          >
                          {searchValue && filteredProfilesCount > 0
                            ? `show me ${currentProfileShow+1} of ${filteredProfilesCount} →`
                            : `show me →`
                          }
                          </button>
                        </form>
                      </div>
                    </div>
                  </WidgetBackground>
                </FullScreen>
              </>
            )}
          }
        </TransformWrapper>
      </BasicErrorBoundary>
      <>
        <div
          ref={setPopperEl}
          className="z-10 hidden p-4 md:block"
          style={{
            ...popperStyles.popper,
            visibility: showTooltip && md ? "visible" : "hidden",
          }}
          {...attributes.popper}
          // onMouseEnter={handleTooltipEnter}
          // onMouseLeave={handleTooltipLeave}
        >
          <FamTooltip
            description={selectedItem?.bio}
            famFollowerCount={selectedItem?.famFollowerCount}
            followerCount={selectedItem?.followersCount}
            imageUrl={selectedItem?.profileImageUrl}
            onClickClose={() => handleClickAway()}
            links={selectedItem?.links}
            title={selectedItem?.name}
            twitterUrl={selectedItem?.profileUrl}
            width="min-w-[20rem] max-w-sm"
            getXAndY={getXAndY}
          />
        </div>
        <Modal
          onClickBackground={() => handleClickAway()}
          show={!md && selectedItem !== undefined}
        >
          {!md && selectedItem !== undefined && (
            <FamTooltip
              description={selectedItem.bio}
              famFollowerCount={selectedItem.famFollowerCount}
              followerCount={selectedItem.followersCount}
              imageUrl={selectedItem.profileImageUrl}
              links={selectedItem.links}
              onClickClose={() => setSelectedItem(undefined)}
              title={selectedItem.name}
              twitterUrl={selectedItem.profileUrl}
              width="min-w-[18rem] max-w-md"
              getXAndY={getXAndY}
            />
          )}
        </Modal>
      </>
    </>
  );
};

export default TwitterFam;
