import React from 'react';

const LoadingBar = (props) => {
  const style = {
    width: `${props.progress}%`,
    backgroundColor: 'red',
    height: '4px',
    position: 'absolute'
  };
  if (props.progress < 0 || props.progress >= 100) return null;
  return (
    <div>
      <div style={style} />
      <div style={{ display: 'table', clear: 'both' }} />
    </div>
  );
};

LoadingBar.propTypes = {
  progress: React.PropTypes.number.isRequired
};

export default LoadingBar;
