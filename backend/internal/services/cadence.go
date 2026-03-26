package services

import (
	"math"
	"sort"

	"github.com/jatayu-proctor/backend/internal/models"
)

type CadenceAnalyzer struct{}

func NewCadenceAnalyzer() *CadenceAnalyzer {
	return &CadenceAnalyzer{}
}

// Analyze takes a slice of inter-key deltas (in ms) and classifies the typing pattern.
func (a *CadenceAnalyzer) Analyze(deltas []float64) models.Verdict {
	if len(deltas) < 10 {
		return models.Verdict{CadenceClass: models.CadenceSuspicious}
	}

	meanVal := mean(deltas)
	stdVal := stddev(deltas, meanVal)
	entVal := entropy(deltas)
	cv := stdVal / meanVal // coefficient of variation

	var class models.CadenceClass
	switch {
	// Synthetic: very low variance (robotic), very low entropy, or unnaturally fast
	case cv < 0.15 || entVal < 1.5 || meanVal < 20:
		class = models.CadenceSynthetic
	// Suspicious: borderline metrics
	case cv < 0.25 || entVal < 2.5:
		class = models.CadenceSuspicious
	default:
		class = models.CadenceOrganic
	}

	return models.Verdict{
		CadenceClass: class,
		MeanDelta:    math.Round(meanVal*100) / 100,
		StdDevDelta:  math.Round(stdVal*100) / 100,
		Entropy:      math.Round(entVal*100) / 100,
	}
}

func mean(data []float64) float64 {
	sum := 0.0
	for _, v := range data {
		sum += v
	}
	return sum / float64(len(data))
}

func stddev(data []float64, avg float64) float64 {
	sum := 0.0
	for _, v := range data {
		sum += (v - avg) * (v - avg)
	}
	return math.Sqrt(sum / float64(len(data)))
}

// entropy computes Shannon entropy on binned delta intervals.
func entropy(data []float64) float64 {
	if len(data) == 0 {
		return 0
	}
	sorted := make([]float64, len(data))
	copy(sorted, data)
	sort.Float64s(sorted)

	// Bin into 20ms buckets
	bins := map[int]int{}
	for _, v := range sorted {
		bucket := int(v / 20)
		bins[bucket]++
	}

	n := float64(len(data))
	h := 0.0
	for _, count := range bins {
		p := float64(count) / n
		if p > 0 {
			h -= p * math.Log2(p)
		}
	}
	return h
}
