import React from 'react';

class LoadingBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      progress: 0,
      opacity: 1,
      message: ''
    };

    this.updateProgress = this.updateProgress.bind(this);
    this.endProgress = this.endProgress.bind(this);
    this.resetProgress = this.resetProgress.bind(this);

    document.addEventListener('progress_update', this.updateProgress, false);
    document.addEventListener('progress_finished', this.endProgress, false);
  }

  componentWillUnmount() {
    document.removeEventListener('progress_update', this.updateProgress, false);
    document.removeEventListener('progress_finished', this.resetProgress, false);
  }

  resetProgress() {
    this.setState({ progress: 0, opacity: 1, message: '' });
  }

  updateProgress(ev) {
    this.setState({
      progress: this.state.progress += 100 / ev.detail.size,
      message: ev.detail.message
    });
  }

  endProgress() {
    if (this.state.progress <= 0) return;
    this.setState({ progress: 100, opacity: 0 });
  }

  render() {
    if (this.state.progress <= 0) return null;
    const style = { width: `${this.state.progress}%` };
    const message = `${this.state.message} ${this.state.progress.toFixed(0)}%`;
    return (
      <div
        className="progress"
        style={{ opacity: this.state.opacity }}
        onTransitionEnd={this.resetProgress}
      >
        <div className="progress-bar progress-bar-info progress-bar-striped active" style={style}>
          <span>{message}</span>
        </div>
      </div>
    );
  }
}

export default LoadingBar;
