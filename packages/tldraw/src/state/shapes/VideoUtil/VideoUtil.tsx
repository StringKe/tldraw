import * as React from 'react'
import { Utils, HTMLContainer } from '@tldraw/core'
import { TDShapeType, TDMeta, VideoShape, TDVideoAsset } from '~types'
import { GHOSTED_OPACITY } from '~constants'
import { TDShapeUtil } from '../TDShapeUtil'
import {
  defaultStyle,
  getBoundsRectangle,
  transformRectangle,
  transformSingleRectangle,
} from '~state/shapes/shared'
import { styled } from '@stitches/react'
import Vec from '@tldraw/vec'

type T = VideoShape
type E = HTMLDivElement

export class VideoUtil extends TDShapeUtil<T, E> {
  type = TDShapeType.Video as const
  canBind = true
  canEdit = true
  canClone = true
  isAspectRatioLocked = true
  showCloneHandles = true
  isStateful = true // don't unmount

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'video',
        type: TDShapeType.Video,
        name: 'Video',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        size: [1, 1],
        rotation: 0,
        style: defaultStyle,
        assetId: 'assetId',
        isPlaying: true,
        currentTime: 0,
      },
      props
    )
  }

  Component = TDShapeUtil.Component<T, E, TDMeta>(
    (
      { shape, asset = { src: '' }, isBinding, isEditing, isGhost, meta, events, onShapeChange },
      ref
    ) => {
      const rVideo = React.useRef<HTMLVideoElement>(null)
      const rWrapper = React.useRef<HTMLDivElement>(null)

      const { currentTime = 0, size, isPlaying, style } = shape

      React.useLayoutEffect(() => {
        const wrapper = rWrapper.current
        if (!wrapper) return
        const [width, height] = size
        wrapper.style.width = `${width}px`
        wrapper.style.height = `${height}px`
      }, [size])

      const onImageLoad = React.useCallback(() => {
        const wrapper = rWrapper.current
        const video = rVideo.current
        if (!(video && wrapper)) return
        if (!Vec.isEqual(size, [401.42, 401.42])) return
        const { videoWidth, videoHeight } = video
        wrapper.style.width = `${videoWidth}px`
        wrapper.style.height = `${videoHeight}px`
        const newSize = [videoWidth, videoHeight]
        const delta = Vec.sub(size, newSize)
        onShapeChange?.({
          id: shape.id,
          point: Vec.add(shape.point, Vec.div(delta, 2)),
          size: [videoWidth, videoHeight],
        })
      }, [size])

      React.useLayoutEffect(() => {
        const video = rVideo.current
        if (!video) return
        if (isPlaying) video.play()
        // throws error on safari
        else video.pause()
      }, [isPlaying])

      React.useLayoutEffect(() => {
        const video = rVideo.current
        if (!video) return
        if (currentTime !== video.currentTime) {
          video.currentTime = currentTime
        }
      }, [currentTime])

      const handlePlay = React.useCallback(() => {
        onShapeChange?.({ id: shape.id, isPlaying: true })
      }, [])

      const handlePause = React.useCallback(() => {
        onShapeChange?.({ id: shape.id, isPlaying: false })
      }, [])

      const handleSetCurrentTime = React.useCallback(() => {
        const video = rVideo.current
        if (!video) return
        if (!isEditing) return
        onShapeChange?.({ id: shape.id, currentTime: video.currentTime })
      }, [isEditing])

      return (
        <HTMLContainer ref={ref} {...events}>
          {isBinding && (
            <div
              className="tl-binding-indicator"
              style={{
                position: 'absolute',
                top: -this.bindingDistance,
                left: -this.bindingDistance,
                width: `calc(100% + ${this.bindingDistance * 2}px)`,
                height: `calc(100% + ${this.bindingDistance * 2}px)`,
                backgroundColor: 'var(--tl-selectFill)',
              }}
            />
          )}
          <Wrapper
            ref={rWrapper}
            isDarkMode={meta.isDarkMode}
            isGhost={isGhost}
            isFilled={style.isFilled}
          >
            <VideoElement
              ref={rVideo}
              id={shape.id + '_video'}
              muted
              loop
              playsInline
              disableRemotePlayback
              disablePictureInPicture
              controls={isEditing}
              autoPlay={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleSetCurrentTime}
              onLoadedMetadata={onImageLoad}
            >
              <source src={(asset as TDVideoAsset).src} />
            </VideoElement>
          </Wrapper>
        </HTMLContainer>
      )
    }
  )

  Indicator = TDShapeUtil.Indicator<T>(({ shape }) => {
    const {
      size: [width, height],
    } = shape

    return (
      <rect x={0} y={0} rx={2} ry={2} width={Math.max(1, width)} height={Math.max(1, height)} />
    )
  })

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  shouldRender = (prev: T, next: T) => {
    return next.size !== prev.size || next.style !== prev.style || next.isPlaying !== prev.isPlaying
  }

  getSvgElement = (shape: VideoShape) => {
    const bounds = this.getBounds(shape)
    const elm = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    elm.setAttribute('width', `${bounds.width}`)
    elm.setAttribute('height', `${bounds.height}`)
    elm.setAttribute('xmlns:xlink', `http://www.w3.org/1999/xlink`)
    return elm
  }

  transform = transformRectangle

  transformSingle = transformSingleRectangle
}

const Wrapper = styled('div', {
  pointerEvents: 'all',
  position: 'relative',
  fontFamily: 'sans-serif',
  fontSize: '2em',
  height: '100%',
  width: '100%',
  borderRadius: '3px',
  perspective: '800px',
  overflow: 'hidden',
  p: {
    userSelect: 'none',
  },
  img: {
    userSelect: 'none',
  },
  variants: {
    isGhost: {
      false: { opacity: 1 },
      true: { transition: 'opacity .2s', opacity: GHOSTED_OPACITY },
    },
    isFilled: {
      true: {},
      false: {},
    },
    isDarkMode: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      isFilled: true,
      isDarkMode: true,
      css: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.3), 1px 1px 4px rgba(0,0,0,.3), 1px 1px 2px rgba(0,0,0,.3)',
      },
    },
    {
      isFilled: true,
      isDarkMode: false,
      css: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.2), 1px 1px 4px rgba(0,0,0,.16),  1px 1px 2px rgba(0,0,0,.16)',
      },
    },
  ],
})

const VideoElement = styled('video', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  minWidth: '100%',
  pointerEvents: 'none',
  objectFit: 'cover',
  userSelect: 'none',
  borderRadius: 2,
})
