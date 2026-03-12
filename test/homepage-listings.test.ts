import { expect, test } from 'vitest'

import { getHomepageListings } from '~/src/helpers/node/homepage-listings.ts'

test( 'Homepage listings collapse transcript duplicates and junk cards', async () => {
    const listings = await getHomepageListings()

    const expectedSingles = [
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
        'LEGO Marvel Avengers: Time Twisted',
        'LEGO Marvel Avengers: Mission Demolition',
        'LEGO Marvel Avengers: Loki in Training',
        'X-Men: Days of Future Past - The Rogue Cut',
        'Marvel Knights: Inhumans',
        'Marvel Super Heroes 4D',
        'Hulk vs. Wolverine',
        'Hulk vs. Thor',
        'Next Avengers: Heroes of Tomorrow',
        'The Incredible Hulk: Edward Norton Cut',
        '8 Arms to Hold You',
        'Spider-Man: Freshman Year',
    ]

    for ( const title of expectedSingles ) {
        expect( listings.filter( ( listing ) => listing.title === title ) ).toHaveLength( 1 )
    }

    for ( const title of expectedAbsent ) {
        expect( listings.filter( ( listing ) => listing.title === title ) ).toHaveLength( 0 )
    }

    const falconListing = listings.find( ( listing ) => listing.title === 'The Falcon and the Winter Soldier' )
    const punisherListings = listings
        .filter( ( listing ) => listing.title === 'Marvel\'s The Punisher' )
        .sort( ( listingA, listingB ) => String( listingA.first_air_date ).localeCompare( String( listingB.first_air_date ) ) )
    const whatIfListings = listings
        .filter( ( listing ) => listing.title === 'What If...?' )
        .sort( ( listingA, listingB ) => String( listingA.first_air_date ).localeCompare( String( listingB.first_air_date ) ) )
    const grootListings = listings
        .filter( ( listing ) => listing.title === 'I Am Groot' )
        .sort( ( listingA, listingB ) => String( listingA.first_air_date ).localeCompare( String( listingB.first_air_date ) ) )
    const doctorStrangeListings = listings
        .filter( ( listing ) => listing.title === 'Doctor Strange' )
        .sort( ( listingA, listingB ) => Number( listingA.id || 0 ) - Number( listingB.id || 0 ) )
    const reactListing = listings.find( ( listing ) => listing.title === 'Deadpool and Korg React' )
    const doomsdayListing = listings.find( ( listing ) => listing.title === 'Avengers: Doomsday' )
    const eyesOfWakandaListing = listings.find( ( listing ) => listing.title === 'Eyes of Wakanda' )
    const beyondSpiderVerseListing = listings.find( ( listing ) => listing.title === 'Spider-Man: Beyond the Spider-Verse' )
    const brandNewDayListing = listings.find( ( listing ) => listing.title === 'Spider-Man: Brand New Day' )
    const wonderManListing = listings.find( ( listing ) => listing.title === 'Wonder Man' )
    const madameWebListing = listings.find( ( listing ) => listing.title === 'Madame Web' )
    const venomLastDanceListing = listings.find( ( listing ) => listing.title === 'Venom: The Last Dance' )
    const friendlyNeighborhoodListing = listings.find( ( listing ) => listing.title === 'Your Friendly Neighborhood Spider-Man' )
    const agathaListing = listings.find( ( listing ) => listing.title === 'Agatha All Along' )
    const whihListing = listings.find( ( listing ) => listing.title === 'WHIH Newsfront' && listing.id === 69069 )
    const doubleAgentListing = listings.find( ( listing ) => listing.title === 'Marvel\'s Agents of S.H.I.E.L.D.: Double Agent' )
    const starkExpoListing = listings.find( ( listing ) => listing.title === 'Stark Expo Shorts' )
    const hulk1982Listing = listings.find( ( listing ) => listing.title === 'The Incredible Hulk' && listing.id === 11328 )

    expect( falconListing?.id ).toBe( 88396 )
    expect( falconListing?.homepageSeasonLabel || '' ).toBe( '' )
    expect( punisherListings.map( ( listing ) => listing.homepageSeasonLabel ) ).toEqual( [
        'Season 1',
        'Season 2',
    ] )
    expect( punisherListings.map( ( listing ) => listing.first_air_date ) ).toEqual( [
        '2017-11-17',
        '2019-01-18',
    ] )
    expect( punisherListings.every( ( listing ) => !!listing.logo_on_black ) ).toBe( true )
    expect( whatIfListings.map( ( listing ) => listing.homepageSeasonLabel ) ).toEqual( [
        'Season 1',
        'Season 2',
        'Season 3',
    ] )
    expect( grootListings.map( ( listing ) => listing.homepageSeasonLabel ) ).toEqual( [
        'Season 1',
        'Season 2',
    ] )
    expect( doctorStrangeListings.map( ( listing ) => listing.id ) ).toEqual( [
        284052,
    ] )
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
    expect( friendlyNeighborhoodListing?.logo_on_black ).toBeTruthy()
    expect( agathaListing?.logo_on_black ).toBeTruthy()
    expect( whihListing?.logo_on_black ).toBeTruthy()
    expect( doubleAgentListing?.logo_on_black ).toBeTruthy()
    expect( starkExpoListing?.logo_on_black ).toBeTruthy()
    expect( hulk1982Listing?.logo_on_black ).toBeTruthy()
} )
