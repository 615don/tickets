const { calculateAssetAge } = require('../assetHelpers');

describe('assetHelpers', () => {
  describe('calculateAssetAge', () => {
    it('should calculate age for asset 3 years old', () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const age = calculateAssetAge(threeYearsAgo);
      expect(age).toBe(3);
    });

    it('should calculate age for asset less than 1 year old', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const age = calculateAssetAge(sixMonthsAgo);
      expect(age).toBe(0);
    });

    it('should return 0 for future in-service date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const age = calculateAssetAge(futureDate);
      expect(age).toBe(0);
    });

    it('should handle null input', () => {
      const age = calculateAssetAge(null);
      expect(age).toBe(0);
    });

    it('should handle undefined input', () => {
      const age = calculateAssetAge(undefined);
      expect(age).toBe(0);
    });

    it('should handle string date input', () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const age = calculateAssetAge(threeYearsAgo.toISOString());
      expect(age).toBe(3);
    });
  });
});
