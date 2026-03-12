import { expect, test } from 'vitest'

import { getHomepageListings } from '~/src/helpers/node/homepage-listings.ts'

test( 'Homepage listings collapse transcript duplicates and junk cards', async () => {
    const listings = await getHomepageListings()

    const expectedSingles = [
        'Marvel\'s The Punisher',
        'I Am Groot',
        'What If...?',
        'Agatha All Along',
        'Avengers: Doomsday',
        'Deadpool and Korg React',
        'Spider-Man: Brand New Day',
        'Wonder Man',
        'Eyes of Wakanda',
        'Madame Web',
        'Venom: The Last Dance',
        'Your Friendly Neighborhood Spider-Man',
    ]

    const expectedAbsent = [
        'LEGO Marvel Avengers: Climate Conundrum',
        'No Way Home: The More Fun Stuff Version',
        'Spider-Man No Way Home: The More Fun Stuff Version',
        'Groot Noses Around',
        'Groot Takes a Bath',
        'Groot\'s First Steps',
        'Magnum Opus',
        'The Little Guy',
        'What If... Peter Quill Attacked Earth\'s Mightiest Heroes?',
        'What If... Iron Man Crashed Into the Grandmaster?',
        'Werewolf By Night in Color',
        'Spider-Man Lotus',
        'Iron Man and His Awesome Friends',
        'Meet Iron Man and His Awesome Friends',
        'Spidey and Iron Man: Avengers Team-Up',
        'Spidey and Iron Man: Avengers Team Up!',
        'Agatha',
        'Agatha: Coven of Chaos',
        'Deadpool\'s Maximum Reactions: Korg and Deadpool',
        'Avengers 5',
        'Avengers: The Kang Dynasty',
        'Fury Files',
        'The Fury Files',
        'Logan Noir',
        'Astonishing X-Men: Torn',
        'Spider-Man 4',
        'Spider-Man 5',
        'Spider-Man 6',
        'Big Hats',
        'MCU Collection',
        'Marvel\'s Avengers: Mightiest Friends',
        'Black Panther 3',
        'Black Panther 3: Legacy of Wakanda',
        'Thor 5',
        'The Legendary Star-Lord',
        'Doctor Strange: Time Runs Out',
        'El Muerto',
        'The Mutants',
    ]

    for ( const title of expectedSingles ) {
        expect( listings.filter( ( listing ) => listing.title === title ) ).toHaveLength( 1 )
    }

    for ( const title of expectedAbsent ) {
        expect( listings.filter( ( listing ) => listing.title === title ) ).toHaveLength( 0 )
    }

    const falconListing = listings.find( ( listing ) => listing.title === 'The Falcon and the Winter Soldier' )
    const whatIfListing = listings.find( ( listing ) => listing.title === 'What If...?' )
    const grootListing = listings.find( ( listing ) => listing.title === 'I Am Groot' )
    const reactListing = listings.find( ( listing ) => listing.title === 'Deadpool and Korg React' )
    const doomsdayListing = listings.find( ( listing ) => listing.title === 'Avengers: Doomsday' )
    const eyesOfWakandaListing = listings.find( ( listing ) => listing.title === 'Eyes of Wakanda' )
    const beyondSpiderVerseListing = listings.find( ( listing ) => listing.title === 'Spider-Man: Beyond the Spider-Verse' )
    const brandNewDayListing = listings.find( ( listing ) => listing.title === 'Spider-Man: Brand New Day' )
    const wonderManListing = listings.find( ( listing ) => listing.title === 'Wonder Man' )
    const madameWebListing = listings.find( ( listing ) => listing.title === 'Madame Web' )
    const venomLastDanceListing = listings.find( ( listing ) => listing.title === 'Venom: The Last Dance' )

    expect( falconListing?.id ).toBe( 88396 )
    expect( falconListing?.homepageSeasonLabel || '' ).toBe( '' )
    expect( whatIfListing?.homepageSeasonLabel ).toBe( 'Season 1, Season 2, Season 3' )
    expect( grootListing?.homepageSeasonLabel ).toBe( 'Season 1, Season 2' )
    expect( reactListing?.logo_on_black ).toBeTruthy()
    expect( doomsdayListing?.logo_on_black ).toBeTruthy()
    expect( eyesOfWakandaListing?.first_air_date ).toBe( '2025-08-01' )
    expect( eyesOfWakandaListing?.logo_on_black ).toBeTruthy()
    expect( beyondSpiderVerseListing?.release_date ).toBe( '2027-06-18' )
    expect( brandNewDayListing?.release_date ).toBe( '2026-07-31' )
    expect( brandNewDayListing?.logo_on_black ).toBeTruthy()
    expect( wonderManListing?.logo_on_black ).toBeTruthy()
    expect( madameWebListing?.logo_on_black ).toBeTruthy()
    expect( venomLastDanceListing?.logo_on_black ).toBeTruthy()
} )
