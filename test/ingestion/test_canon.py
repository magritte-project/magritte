import pytest

from magritte.ingestion.canon import Canon, Canonizer, CanonNormalization


@pytest.fixture
def canon():
    return Canon(
        albums=[],
        artists=[
            CanonNormalization(canonical="Jesse & Joy", alternates=["Jesse y Joy"]),
            CanonNormalization(canonical="Kesha", alternates=["Ke$ha"]),
            CanonNormalization(canonical="Lights", alternates=[]),
        ],
    )


@pytest.fixture
def canonizer(canon: Canon):
    return Canonizer(canon)


def test_fix_artist_name(canonizer: Canonizer):
    assert canonizer.fix_artist(None) is None, "It should propagate None"
    assert canonizer.fix_artist("The Beatles") == "The Beatles", (
        "It should not change names without normalizations"
    )
    assert canonizer.fix_artist("Jesse y Joy") == "Jesse & Joy", (
        "It should fix artist names with known alternates"
    )
    assert canonizer.fix_artist("KE$HA") == "Kesha", (
        "It should fix artist names with known alternates regardless of case"
    )
    assert canonizer.fix_artist("LIGHTS") == "Lights", (
        "It should fix capitalization issues without explicit alternates"
    )
