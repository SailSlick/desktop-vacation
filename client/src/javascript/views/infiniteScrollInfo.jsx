import React from 'react';

const InfinteScrollInfo = ({ itemsLimit, itemsTotal }) => {
  console.log(itemsLimit, itemsTotal);
  if (itemsLimit >= itemsTotal) {
    return (
      <h4 className="scroll-info">End of gallery</h4>
    );
  }

  return (
    <h4 className="scroll-info">Scroll to load more</h4>
  );
};

InfinteScrollInfo.propTypes = {
  itemsLimit: React.PropTypes.number.isRequired,
  itemsTotal: React.PropTypes.number.isRequired
};

export default InfinteScrollInfo;
