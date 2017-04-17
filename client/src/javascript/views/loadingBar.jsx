import React from 'react';

const LoadingBar = (props) => {
  if (props.progress <= 0) return null;
  const style = {
    width: `${props.progress}%`
  };
  return (
    <div id="progress-bar">
      <span style={style}>{props.progress.toFixed(2)}%</span>
    </div>
  );
};

LoadingBar.propTypes = {
  progress: React.PropTypes.number.isRequired
};

export default LoadingBar;
