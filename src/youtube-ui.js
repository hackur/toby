class YouTubeUI extends React.Component {
  constructor() {
    super();

    this.state = {
      player: null,
      applyFilter: ""
    };
  }
  setupYTPlayer() {
    const onPlayerReady = function(e) {
      // $(window.frames[0].document).on("keydown", function (e) {
      //   $(top.document).trigger(e);
      // });

      player.setVolume(30);
    };

    const onPlayerStateChange = function(e) {
      let videoInfo = e.target.getVideoData();
      if(videoInfo.title !== "") {
        document.title = videoInfo.title;

        this.setState({
          currentVideo: {
            title: videoInfo.title,
            ytid: videoInfo.video_id
          }
        });

        // $.post({
        //   url: '/api/videos/recently-played/add',
        //   data: {
        //     title: video.title,
        //     ytid: video.ytid
        //   }
        // });
      }
    }.bind(this);

    let player;
    window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player('player', {
        //videoId: 'FnERt5fGoOg',
        playerVars: {
          'autoplay': 0,
          'autohide': 1,
          'iv_load_policy': 3 },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });

      // $(window.frames[0].document).on('keydown', function (e) {
      //     $(top.document).trigger('keydown', e);
      // });

      if(navigator.userAgent.includes("nwjs")) {
        console.log("setting nwdisable on YouTube player iframe...");
        $("#player").attr("nwdisable", "");
      }

      this.setState({
        player: player
      });

      setInterval(function() {
        $("#player").contents().find(".adDisplay").css("display", "none");
      }, 2000);

    }.bind(this);
  }
  playVideo(video) {
    console.log(`Inside YouTubeUI playVideo() - ${video.ytid}`);

    this.state.player.setVolume(30);
    this.state.player.loadVideoById(video.ytid);

    let $player = $("#player"),
        $ui = $("#ui");

    if($player.css("display") !== "block") {
      $player.css("display", "block");
    }

    $ui.animate({ scrollTop: $ui.prop("scrollHeight")}, 250);
  }
  componentDidMount() {
    $.getScript("https://www.youtube.com/iframe_api", function(data, textStatus, jqxhr) {
      if(textStatus === "success") {
        console.log("YouTube API loaded...");
        this.setupYTPlayer();
      }
    }.bind(this));

    // var tag = document.createElement('script');
    // tag.src = "https://www.youtube.com/iframe_api";
    // var firstScriptTag = document.getElementsByTagName('script')[0];
    // firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    //this.setupYTPlayer();
  }
  componentWillReceiveProps(nextProps) {
    console.log("YouTube Component - RecieveProps");
    console.log(nextProps);

    if((navigator.userAgent.includes("nwjs") ||
        navigator.userAgent.includes("Electron")) &&
      nextProps.applyFilter !== undefined  && nextProps.applyFilter.length > 0) {

      if(this.state.applyFilter !== undefined &&
         this.state.applyFilter !== nextProps.applyFilter) {

        let $player = $("#player").contents().find(".html5-main-video");

        switch(nextProps.applyFilter) {
          case "grayscale":
            $player.css("-webkit-filter", "grayscale(1)");
            break;
          case "saturate":
            $player.css("-webkit-filter", "saturate(2.5)");
            break;
          case "sepia":
            $player.css("-webkit-filter", "sepia(1)");
            break;
          case "normal":
            $player.css("-webkit-filter", "");
            break;
        }

        this.setState({
          applyFilter: nextProps.applyFilter
        });

        console.log("We have an applyFilter set so returning without causing play() to happen...");

        return;
      }
    }

    if(nextProps.video !== undefined && (!(_.isEmpty(nextProps.video))) &&
       nextProps.video.ytid !== undefined) {

      if(this.state.currentVideo !== undefined &&
         this.state.currentVideo.ytid === nextProps.video.ytid) return;

      this.setState({
        currentVideo: nextProps.video
      });

      this.playVideo(nextProps.video);
    } else {
      this.state.player.stopVideo();
      $("#player").css("display", "none");

      this.setState({
        currentVideo: ""
      });
    }
  }
  render() {
    return (
      <div id="player"></div>
    );
  }
}
