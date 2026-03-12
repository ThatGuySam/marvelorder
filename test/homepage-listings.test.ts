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
        'Agatha',
        'Agatha: Coven of Chaos',
        'Avengers 5',
        'Avengers: The Kang Dynasty',
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
} )
